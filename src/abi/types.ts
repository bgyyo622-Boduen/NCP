/**
 * NCP 中斷向量表：定義核心對隨機行程的物理干預語意
 */
export enum InterruptVector {
  APPROVED = "0x00",           // 准予執行
  DEGRADED_APPROVAL = "0x01",  // 降級准予：縮小權能範圍
  REQUIRE_HUMAN_GATE = "0x02", // 掛起：等待外部實體簽核
  SANDBOX_ONLY = "0x03",       // 隔離：僅限影子環境執行
  DENIED = "0x04",             // 拒絕：非法意圖或重放攻擊
  QUARANTINED = "0x05",        // 封鎖：偵測到認知失控，強制終止行程
  DEFERRED = "0x06"            // 延遲：系統資源壓力，進入等待隊列
}

export type Decision = keyof typeof InterruptVector;

export interface CapabilityRequest {
  protocol: "ncp/1.0";
  traceability: {
    cpid: string;              // 認知行程 ID (UUID)
    parent_state_root: string; // 父節點狀態雜湊 (SHA-256)
    reasoning_hash: string;    // 推論過程的密碼學快照
    nonce: number;             // 單調遞增序號 (Anti-Replay)
    timestamp: number;         // 毫秒級 Unix 時間戳
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
  new_state_root: string;      // 經由 Kernel 簽署的新狀態根
  c_psi_status: string;        // 認知壓力失速指標 (c-PSI)
  granted_capabilities?: any[];
}
