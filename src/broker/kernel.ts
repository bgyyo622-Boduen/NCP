import { CapabilityRequest, ExecutionLease, Decision, InterruptVector } from "../abi/types";
import { CWALDaemon } from "../cwal/daemon";
import { CSIEngine } from "../telemetry/csi-engine";
import { CCgroupsController } from "../cgroups/controller";

export class NCPBroker {
  private cwal = new CWALDaemon();
  private cgroups = new CCgroupsController();
  private authoritative_roots = new Map<string, string>(); // Ring 0 權威狀態表
  private current_world_version = "v_1001"; // 物理世界快照

  public async arbitrate(req: CapabilityRequest): Promise<ExecutionLease> {
    const cpid = req.traceability.cpid;
    const kernel_root = this.authoritative_roots.get(cpid) || "genesis_root";

    // A. 權威血統驗證 (Anti-Fork)
    if (req.traceability.parent_state_root !== kernel_root) {
      return this.reject("DESYNCHRONIZED", InterruptVector.DESYNCHRONIZED, "LINEAGE_FORK");
    }

    // B. 世界狀態同步驗證 (Anti-Stale)
    if (req.traceability.world_snapshot_id !== this.current_world_version) {
      return this.reject("DESYNCHRONIZED", InterruptVector.DESYNCHRONIZED, "WORLD_STALE");
    }

    // C. 防重放校驗
    const history = this.cwal.getHistory(cpid);
    const lastEntry = history[history.length - 1];
    if (lastEntry && req.traceability.nonce <= lastEntry.request.traceability.nonce) {
      return this.reject("DENIED", InterruptVector.DENIED, "NONCE_REPLAY");
    }

    // D. 治理與仲裁
    const csi = CSIEngine.calculateInstability(history, req);
    const cgCheck = this.cgroups.evaluatePressure(req, csi);
    if (cgCheck.decision) return this.finalize(cgCheck.decision as Decision, req, csi, cgCheck.reason);

    let decision: Decision = "APPROVED";
    if (req.intent.effect_class === "EXTERNAL_IRREVERSIBLE") decision = "REQUIRE_HUMAN_GATE";

    return this.finalize(decision, req, csi, "STABLE");
  }

  private async finalize(decision: Decision, req: CapabilityRequest, csi: number, status: string): Promise<ExecutionLease> {
    const newStateRoot = this.cwal.calculateStateRoot(req.traceability.parent_state_root, req, decision, this.current_world_version);
    this.authoritative_roots.set(req.traceability.cpid, newStateRoot);
    await this.cwal.commit({ cpid: req.traceability.cpid, request: req, decision, state_root: newStateRoot, csi });
    
    return {
      protocol: "ncp/1.0", decision, interrupt_vector: InterruptVector[decision],
      new_state_root: newStateRoot, lease_ttl_ms: 30000, world_version_lock: this.current_world_version,
      c_psi_status: status
    };
  }

  private reject(decision: Decision, vector: InterruptVector, reason: string): ExecutionLease {
    return { protocol: "ncp/1.0", decision, interrupt_vector: vector, c_psi_status: reason, new_state_root: "INVALID", lease_ttl_ms: 0, world_version_lock: "N/A" };
  }
}
