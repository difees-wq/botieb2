import { Request, Response } from "express";
import { FlowEngine } from "../flow-engine/flow-engine.js";
import { ValidationError } from "../domain/errors.js";

export class FlowsController {
constructor(private readonly flow: FlowEngine) {}

async getFlow(req: Request, res: Response) {
try {
const tipo = req.params.tipo.toUpperCase();

  const def = this.flow.getFlowDefinition(tipo);

  return res.json({
    id: def.id,
    version: def.version,
    nodos: def.nodos
  });
} catch (e: any) {
  if (e instanceof ValidationError) {
    return res.status(400).json({ error: e.code, message: e.message });
  }
  return res.status(500).json({ error: "ERROR_INTERNO" });
}


}
}

