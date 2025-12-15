
import { Request, Response } from "express";

export class HealthController {
async status(_req: Request, res: Response) {
return res.json({ ok: true, ts: Date.now() });
}
}
