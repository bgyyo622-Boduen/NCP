import { CapabilityRequest, ExecutionLease, Decision, InterruptVector } from "../abi/types";
import { CWALDaemon } from "../cwal/daemon";
import { CSIEngine } from "../telemetry/csi-engine";
import { CCgroupsController } from "../cgroups/controller";

export class NCPBroker {
  private cwal = new CWALDaemon();
  private cgroups = new CCgroupsController();

  public async arbitrate(req: CapabilityRequest): Promise<ExecutionLease> {
    const history = this.cwal.getHistory(req.traceability.cpid);
    
    // 1. 計算認知穩定指數 (CSI)
    const csi = CSIEngine.calculateInstability(history, req);
    
    let decision: Decision = "APPROVED";
    let c_psi_status = "STABLE";

    // 2. 檢查 c-cgroups 物理限制
    const cgCheck = this.cgroups.evaluatePressure(req, csi);
    if (cgCheck.decision) {
      decision = cgCheck.decision as Decision;
      c_psi_status = `STALLED: ${cgCheck.reason}`;
    } 
    // 3. 執行認知塑形 (Cognition Shaping)
    else if (req.intent.effect_class === "EXTERNAL_IRREVERSIBLE") {
      decision = "REQUIRE_HUMAN_GATE"; // RFC-0002: 兩階段提交掛起
    } 
    else if (req.intent.requested_capabilities.some(c => c.scope === "*")) {
      decision = "DEGRADED_APPROVAL";  // RFC-0002: 強制降級
    }

    // 4. 狀態轉移與 CWAL 持久化
    const newStateRoot = this.cwal.calculateStateRoot(req.traceability.parent_state_root, req, decision);
    
    await this.cwal.commit({
      cpid: req.traceability.cpid,
      timestamp: new Date().toISOString(),
      csi_score: csi,
      request: req,
      decision: decision,
      state_root: newStateRoot
    });

    // 5. 核發租約
    return {
      protocol: "ncp/1.0",
      decision,
      interrupt_vector: InterruptVector[decision],
      new_state_root: newStateRoot,
      c_psi_status,
      granted_capabilities: decision === "DEGRADED_APPROVAL" 
        ? req.intent.requested_capabilities.map(c => ({ ...c, scope: "RESTRICTED_ID" })) 
        : req.intent.requested_capabilities
    };
  }
}
