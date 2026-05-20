import { CapabilityRequest } from "../abi/types";

export class CCgroupsController {
  private manifest = {
    capability: { denied_namespaces: ["system.shell", "network.admin"] },
    entropy: { max_csi: 0.8 } // 最大容忍熵值
  };

  public evaluatePressure(req: CapabilityRequest, csi: number): { decision: string | null, reason: string } {
    // 1. 命名空間檢查
    const hasDenied = req.intent.requested_capabilities.some(cap => 
      this.manifest.capability.denied_namespaces.includes(cap.resource)
    );
    if (hasDenied) return { decision: "DENIED", reason: "Namespace violation." };

    // 2. 熵值壓力檢查
    if (csi >= this.manifest.entropy.max_csi) {
      return { decision: "QUARANTINED", reason: "Entropy Stall: CSI threshold reached." };
    }

    return { decision: null, reason: "STABLE" };
  }
}
