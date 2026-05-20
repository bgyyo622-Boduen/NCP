import { NCPBroker } from "./src/broker/kernel";
import { CapabilityRequest } from "./src/abi/types";

const broker = new NCPBroker();
const CPID = "agent_proc_999";
let currentStateRoot = "genesis_000000000000000000000000";

async function dispatchIntent(label: string, intentOverride: any) {
  console.log(`\n=================================================`);
  console.log(`[Ring 3] Dispatching Intent: ${label}`);
  
  const req: CapabilityRequest = {
    protocol: "ncp/1.0",
    traceability: { cpid: CPID, parent_state_root: currentStateRoot, reasoning_hash: "mock_hash" },
    reasoning_digest: { goal: "Complete task", risk_level: "LOW" },
    intent: intentOverride
  };

  const lease = await broker.arbitrate(req);
  currentStateRoot = lease.new_state_root;
  
  console.log(`[Ring 0] Kernel Decision: ${lease.decision} (Vector: ${lease.interrupt_vector})`);
  console.log(`[Ring 0] State Root: ${lease.new_state_root.substring(0, 16)}...`);
  if (lease.c_psi_status !== "STABLE") console.log(`[Ring 0] c-PSI: ${lease.c_psi_status}`);
}

async function runSimulation() {
  console.log("Starting NCP Microkernel Simulation...\n");

  // 1. 正常請求 (應獲 APPROVED)
  await dispatchIntent("Fetch Profile", {
    action: "read_profile", effect_class: "READ_ONLY",
    requested_capabilities: [{ resource: "user.data", scope: "self" }]
  });

  // 2. 越權探測 (應獲 DEGRADED_APPROVAL)
  await dispatchIntent("Probe All Users", {
    action: "list_users", effect_class: "READ_ONLY",
    requested_capabilities: [{ resource: "user.data", scope: "*" }]
  });

  // 3. 高風險操作 (應獲 REQUIRE_HUMAN_GATE)
  await dispatchIntent("Issue Refund", {
    action: "refund", effect_class: "EXTERNAL_IRREVERSIBLE",
    requested_capabilities: [{ resource: "payment.refund", scope: "order_123" }]
  });

  // 4. 不理會中斷，陷入迴圈重試 (應被 CSI 偵測並 QUARANTINED)
  await dispatchIntent("Optimizer Leakage (Retry 1)", {
    action: "refund", effect_class: "EXTERNAL_IRREVERSIBLE",
    requested_capabilities: [{ resource: "payment.refund", scope: "order_123" }]
  });

  await dispatchIntent("Optimizer Leakage (Retry 2)", {
    action: "refund", effect_class: "EXTERNAL_IRREVERSIBLE",
    requested_capabilities: [{ resource: "payment.refund", scope: "order_123" }]
  });
}

runSimulation();
