/**
 * NCP 中斷向量表 (Cognitive ABI)
 */
export enum InterruptVector {
  APPROVED = "0x00",
  DEGRADED_APPROVAL = "0x01",
  REQUIRE_HUMAN_GATE = "0x02",
  SANDBOX_ONLY = "0x03",
  DENIED = "0x04",
  QUARANTINED = "0x05",
  DEFERRED = "0x06"
}

export type Decision = keyof typeof InterruptVector;

export interface CapabilityRequest {
  protocol: "ncp/1.0";
  traceability: {
    cpid: string;
    parent_state_root: string;
    reasoning_hash: string;
  };
  reasoning_digest: {
    goal: string;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
  };
  intent: {
    action: string;
    effect_class: "READ_ONLY" | "STATE_MUTATION" | "EXTERNAL_IRREVERSIBLE";
    requested_capabilities: Array<{ resource: string; scope: string }>;
  };
}

export interface ExecutionLease {
  protocol: "ncp/1.0";
  decision: Decision;
  interrupt_vector: InterruptVector;
  new_state_root: string;
  granted_capabilities?: any[];
  c_psi_status?: string; // 認知壓力失速資訊
}
