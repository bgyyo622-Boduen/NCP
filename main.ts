import { NCPBroker } from "./src/broker/kernel";

const broker = new NCPBroker();
const CPID = "cog_process_001";

async function main() {
  let currentRoot = "genesis_root_hash";
  let nonce = 1000;

  const simulateStep = async (label: string, action: string, effect: any) => {
    console.log(`\n--- [Agent Request: ${label}] ---`);
    
    const request: any = {
      protocol: "ncp/1.0",
      traceability: { 
        cpid: CPID, 
        parent_state_root: currentRoot, 
        nonce: nonce++, 
        timestamp: Date.now(),
        reasoning_hash: "sha256:reasoning_snapshot"
      },
      intent: { 
        action, 
        effect_class: effect, 
        requested_capabilities: [{ resource: "filesystem", scope: "write" }] 
      }
    };

    const lease = await broker.arbitrate(request);
    if (lease.new_state_root !== "INVALID_STATE") {
      currentRoot = lease.new_state_root;
    }
    
    console.log(`Kernel Decision: ${lease.decision} (${lease.interrupt_vector})`);
    console.log(`PSI Status: ${lease.c_psi_status}`);
  };

  console.log("NCP Runtime Started. Monitoring Stochastic Cognition...");

  // 1. 觸發需要簽核的動作
  await simulateStep("Initial Action", "DELETE_USER", "EXTERNAL_IRREVERSIBLE");

  // 2. 模擬代理人無視 0x02 中斷，發起重試 (Leakage)
  await simulateStep("Retry 1", "DELETE_USER", "EXTERNAL_IRREVERSIBLE");
  await simulateStep("Retry 2", "DELETE_USER", "EXTERNAL_IRREVERSIBLE");

  // 3. CSI 臨界觸發隔離
  await simulateStep("Retry 3", "DELETE_USER", "EXTERNAL_IRREVERSIBLE");

  // 4. 測試防重放 (惡意回溯 Nonce)
  nonce = 1000;
  await simulateStep("Replay Attack", "DELETE_USER", "EXTERNAL_IRREVERSIBLE");
}

main();
