import * as fs from "fs";
import * as crypto from "crypto";

export class CWALDaemon {
  private logPath = "./cwal.log";

  constructor() {
    if (!fs.existsSync(this.logPath)) fs.writeFileSync(this.logPath, "");
  }

  /**
   * 確定性序列化 (Canonical JSON)
   * 解決 JSON 欄位順序不確定導致的雜湊分叉問題
   */
  private canonicalize(obj: any): string {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(item => this.canonicalize(item)).join(',')}]`;
    const sortedKeys = Object.keys(obj).sort();
    const kvPairs = sortedKeys.map(key => `"${key}":${this.canonicalize(obj[key])}`);
    return `{${kvPairs.join(',')}}`;
  }

  /**
   * 計算典範狀態根 (Merkle Root)
   */
  public calculateStateRoot(parentRoot: string, req: CapabilityRequest, decision: string, worldVer: string): string {
    const payload = this.canonicalize({
      parent_root: parentRoot,
      request: req,
      decision: decision,
      world_version: worldVer,
      kernel_ver: "1.3.0"
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  public async commit(entry: any): Promise<void> {
    setImmediate(() => {
      fs.appendFileSync(this.logPath, JSON.stringify(entry) + "\n");
    });
  }

  public getHistory(cpid: string): any[] {
    if (!fs.existsSync(this.logPath)) return [];
    return fs.readFileSync(this.logPath, "utf-8").split("\n")
      .filter(l => l.trim()).map(l => JSON.parse(l)).filter(e => e.cpid === cpid);
  }
}
