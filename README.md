# NCP Kernel: Microkernel for Stochastic Cognition

[![Status](https://img.shields.io/badge/Status-Alpha-blue.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

> **NCP (神經-符號權能協定)** 不是一個 AI 代理（Agent）框架，而是一套**隨機性運算治理底層（Stochastic Computation Governance Substrate）**。
> 我們不再試圖「對齊（Align）」AI 的靈魂，而是從作業系統層級治理它的行程。

## 專案簡介

隨著大型語言模型（LLMs）取得高度自主執行權，傳統基於「遠端程序呼叫（RPC）」的代理架構已無法抵禦**最佳化器洩漏（Optimizer Leakage）**與**認知熵失控（Cognitive Entropy Runaway）**。

NCP 將微核心（Microkernel）架構引入 AI 領域。它將代理人降級為不可信的**隨機性使用者空間行程（Ring 3）**，並導入**認知作業系統監視器（Ring 0 Hypervisor）**。透過執行租約、認知預寫式日誌（CWAL）與認知穩定指數（CSI），NCP 確保不可信的推論引擎能於決定性基礎設施內安全收斂。

### 核心機制
* **Ring 0 / Ring 3 特權隔離**：代理人絕對無法對其自身的認知血統（Cognition Lineage）進行密碼學上的自我證明。
* **中斷驅動 ABI**：代理人不再接收常規報錯，而是接收執行期中斷（如 `DEGRADED_APPROVAL` 強制降級、`REQUIRE_HUMAN_GATE` 強制人類簽核）。
* **CWAL 預寫式日誌**：基於梅克爾樹（Merkle Tree）的 Append-only 日誌，作為認知狀態轉移的唯一真相來源。
* **CSI 認知降頻保護**：當認知不穩定張量的收斂梯度急遽惡化（$d(CSI)/dt \gg 0$）時，系統將自動觸發隔離（Quarantined）。
* **c-cgroups 認知控制群組**：不再單純計算 Token，而是針對「認知擴張壓力」建立物理隔離邊界。

---

## 快速開始 (Quick Start)

### 環境要求
* Node.js (v18+)
* TypeScript (`npm install -g typescript ts-node`)

### 安裝與執行
```bash
git clone [https://github.com/your-org/ncp-kernel.git](https://github.com/your-org/ncp-kernel.git)
cd ncp-kernel
npm install
npm start
