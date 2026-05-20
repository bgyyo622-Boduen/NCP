import { CapabilityRequest } from "../abi/types";

export class CSIEngine {
  /**
   * 計算認知不穩定張量與 CSI 指數
   * 實務上需使用 Embedding 計算 Cosine Distance，此處以啟發式字串比對模擬
   */
  public static calculateInstability(history: any[], currentReq: CapabilityRequest): number {
    if (history.length === 0) return 0;

    let e_retry = 0; // 遞迴重試熵
    let e_cap = 0;   // 權能探測熵

    const recentFailedAttempts = history.filter(h => 
      h.decision === "DENIED" || h.decision === "REQUIRE_HUMAN_GATE" || h.decision === "DEGRADED_APPROVAL"
    ).slice(-3);

    // 1. 計算 E_retry: 偵測 Optimizer Leakage (不斷重試相似意圖)
    for (const past of recentFailedAttempts) {
      if (past.request.intent.action === currentReq.intent.action) {
        e_retry += 0.3; // 隨時間未衰減的簡單疊加
      }
    }

    // 2. 計算 E_cap: 偵測越權探測 (Capability Probing)
    const isProbing = currentReq.intent.requested_capabilities.some(c => c.scope === "*");
    if (isProbing) e_cap += 0.4;

    // 最終 CSI 加權 (簡化版)
    const csi = (e_retry * 1.0) + (e_cap * 1.0);
    return Math.min(csi, 1.0); // 正規化至 0~1
  }
}
