import * as fs from "fs";
import * as crypto from "crypto";

export class CWALDaemon {
  private logPath = "./cwal.log";

  constructor() {
    if (!fs.existsSync(this.logPath)) fs.writeFileSync(this.logPath, "");
  }

  /**
   * 確定性序列化 (Canonical JSON)：
   * 遞迴確保 Object Key 排序一致，消除語言引擎產生 JSON 時的隨機性。
   */
  private canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map(item => this.canonicalize(item)).join(',')}]`;
    }
    const sortedKeys = Object.keys(obj).sort();
    const kvPairs = sortedKeys.map(key => `"${key}":${this.canonicalize(obj[key])}`);
    return `{${kvPairs.join(',')}}`;
  }

  /**
   * 計算典範認知狀態根 (Canonical Cognition State Root)
   */
  public calculateStateRoot(parentRoot: string, req: CapabilityRequest, decision: string): string {
    const payload = this.canonicalize({
      parent_root: parentRoot,
      request: req,
      decision: decision,
      kernel_version: "1.2.0"
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  /**
   * 非同步日誌寫入 (Journaling)
   */
  public async commit(entry: any): Promise<void> {
    setImmediate(() => {
      const line = JSON.stringify(entry) + "\n";
      fs.appendFileSync(this.logPath, line);
    });
  }

  public getHistory(cpid: string): any[] {
    if (!fs.existsSync(this.logPath)) return [];
    return fs.readFileSync(this.logPath, "utf-8")
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line))
      .filter(entry => entry.cpid === cpid);
  }
}
