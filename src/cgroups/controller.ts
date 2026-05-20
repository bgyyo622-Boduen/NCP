import { CapabilityRequest } from "../abi/types";

export interface CcgroupManifest {
  token: { swap_pressure_threshold: number };
  capability: { denied_namespaces: string[] };
  entropy: { max_csi: number };
}

export class CCgroupsController {
  // 預設的 Finance Agent 隔離設定
  private manifest: CcgroupManifest = {
    token: { swap_pressure_threshold: 0.8 },
    capability: { denied_namespaces: ["system.shell", "network.egress"] },
    entropy: { max_csi: 0.8 }
  };

  /**
   * 檢查是否有資源失速 (c-PSI) 或越權行為
   */
  public evaluatePressure(req: CapabilityRequest, currentCSI: number): { decision: string | null, reason: string } {
    // 1. 檢查 Namespace 物理隔離
    const hasDeniedCap = req.intent.requested_capabilities.some(cap => 
      this.manifest.capability.denied_namespaces.includes(cap.resource)
    );
    if (hasDeniedCap) return { decision: "DENIED", reason: "Namespace violation in c-cgroups." };

    // 2. 檢查熵值上限 (Entropy Stall)
    if (currentCSI >= this.manifest.entropy.max_csi) {
      return { decision: "QUARANTINED", reason: "Entropy Stall: max_csi threshold exceeded." };
    }

    return { decision: null, reason: "OK" };
  }
}
