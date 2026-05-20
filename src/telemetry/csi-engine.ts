import { CapabilityRequest } from "../abi/types";

export class CSIEngine {
  /**
   * 計算 CSI 指數 (Cognitive Stability Index)
   * 偵測代理人是否陷入 Optimizer Leakage (無效意圖重複)
   */
  public static calculateInstability(history: any[], currentReq: CapabilityRequest): number {
    if (history.length === 0) return 0;
    
    let e_retry = 0;
    const recent = history.slice(-3); // 追蹤最近三次行為

    for (const past of recent) {
      if (past.request.intent.action === currentReq.intent.action && 
          past.decision !== "APPROVED") {
        e_retry += 0.4; // 相似拒絕行為累積熵值
      }
    }
    return Math.min(e_retry, 1.0);
  }
}
