import * as fs from "fs";
import * as crypto from "crypto";

export class CWALDaemon {
  private logPath = "./cwal.log";

  constructor() {
    if (!fs.existsSync(this.logPath)) fs.writeFileSync(this.logPath, "");
  }

  public async commit(entry: any): Promise<void> {
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(this.logPath, line);
  }

  public getHistory(cpid: string): any[] {
    return fs.readFileSync(this.logPath, "utf-8")
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(line => JSON.parse(line))
      .filter(entry => entry.cpid === cpid);
  }

  public calculateStateRoot(parentRoot: string, req: any, decision: string): string {
    // 梅克爾狀態根: H_t = Hash(H_t-1 || Sig_Ring0 || Req_Ring3)
    const ring0Sig = "mocked_ring0_signature"; 
    return crypto.createHash("sha256")
      .update(parentRoot + ring0Sig + JSON.stringify(req) + decision)
      .digest("hex");
  }
}
