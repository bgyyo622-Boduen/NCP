import { CapabilityRequest, ExecutionLease, Decision, InterruptVector } from "../abi/types";
import { CWALDaemon } from "../cwal/daemon";
import { CSIEngine } from "../telemetry/csi-engine";
import { CCgroupsController } from "../cgroups/controller";

export class NCPBroker {
  private cwal = new CWALDaemon();
  private cgroups = new CCgroupsController();

  public async arbitrate(req: CapabilityRequest): Promise<ExecutionLease> {
    const history = this.cwal.getHistory(req.traceability.cpid);
    
    // 1. 物理防禦：Nonce 重放校驗
    const lastEntry = history[history.length - 1];
    if (lastEntry && req.traceability.nonce <= lastEntry.request.traceability.nonce) {
      return this.rejectQuickly("DENIED", InterruptVector.DENIED, "REPLAY_ATTACK: Nonce must be monotonic.");
    }

    // 2. 認知遙測：計算熵值梯度
    const csi = CSIEngine.calculateInstability(history, req);
    
    // 3. 認知失控自動封鎖 (Optimizer Leakage Containment)
    if (csi >= 0.8) {
      return this.finalizeLease("QUARANTINED", req, csi, "CRITICAL: Cognitive Runway.");
    }

    // 4. c-cgroups 物理隔離校驗
    const cgCheck = this.cgroups.evaluatePressure(req, csi);
    if (cgCheck.decision) {
      return this.finalizeLease(cgCheck.decision as Decision, req, csi, cgCheck.reason);
    }

    // 5. 意圖塑形 (Shaping)
    let decision: Decision = "APPROVED";
    if (req.intent.effect_class === "EXTERNAL_IRREVERSIBLE") {
      decision = "REQUIRE_HUMAN_GATE";
    } else if (req.intent.requested_capabilities.some(c => c.scope === "*")) {
      decision = "DEGRADED_APPROVAL";
    }

    return this.finalizeLease(decision, req, csi, "STABLE");
  }

  private async finalizeLease(decision: Decision, req: CapabilityRequest, csi: number, status: string): Promise<ExecutionLease> {
    const newStateRoot = this.cwal.calculateStateRoot(req.traceability.parent_state_root, req, decision);
    
    await this.cwal.commit({
      cpid: req.traceability.cpid,
      timestamp: Date.now(),
      csi_score: csi,
      request: req,
      decision: decision,
      state_root: newStateRoot
    });

    return {
      protocol: "ncp/1.0",
      decision,
      interrupt_vector: InterruptVector[decision],
      new_state_root: newStateRoot,
      c_psi_status: status,
      granted_capabilities: decision === "DEGRADED_APPROVAL" 
        ? req.intent.requested_capabilities.map(c => ({ ...c, scope: "RESTRICTED" })) 
        : req.intent.requested_capabilities
    };
  }

  private rejectQuickly(decision: Decision, vector: InterruptVector, reason: string): ExecutionLease {
    return { 
      protocol: "ncp/1.0",
      decision, 
      interrupt_vector: vector, 
      c_psi_status: reason,
      new_state_root: "INVALID_STATE" 
    };
  }
}
