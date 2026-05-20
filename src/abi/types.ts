/**
 * NCP 中斷向量表：定義核心對隨機行程的物理干預語意
 */
export enum InterruptVector {
  APPROVED = "0x00",           // 准予執行
  DEGRADED_APPROVAL = "0x01",  // 降級准予：縮小權能範圍
  REQUIRE_HUMAN_GATE = "0x02", // 掛起：等待人類簽核 (兩階段提交)
  SANDBOX_ONLY = "0x03",       // 隔離執行：僅限影子環境
  DENIED = "0x04",             // 拒絕：非法意圖或 Nonce 錯誤
  QUARANTINED = "0x05",        // 封鎖：偵測到認知失控 (CSI 熔斷)
  DEFERRED = "0x06",           // 延遲：非同步等待系統資源
  DESYNCHRONIZED = "0x07"      // 重大中斷：認知血統分叉或物理世界過時
}

export type Decision = keyof typeof InterruptVector;

export interface CapabilityRequest {
  protocol: "ncp/1.0";
  traceability: {
    cpid: string;              // 認知行程 ID
    parent_state_root: string; // 代理人宣稱的父節點雜湊
    reasoning_hash: string;    // 推論過程的密碼學快照
    nonce: number;             // 單調遞增序號 (防禦 Replay Attack)
    timestamp: number;         // 請求時間戳
    world_snapshot_id: string; // 綁定推論時參考的物理世界版本
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
  new_state_root: string;      // 經 Kernel 簽署的權威狀態根
  lease_ttl_ms: number;        // 租約有效期
  world_version_lock: string;  // 鎖定的物理版本
  c_psi_status: string;        // 認知壓力失速指標 (c-PSI)
}
