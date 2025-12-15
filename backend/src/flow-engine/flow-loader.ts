
import fs from "fs";
import path from "path";
import { FlowDefinition } from "./flow-node-types";
import { FlowValidator } from "./flow-validator";
import { FlowStateError } from "../domain/errors";

export class FlowLoader {
static loadAllFlows(): Record<string, FlowDefinition> {
const flowsDir = path.join(process.cwd(), "config", "flows");

    if (!fs.existsSync(flowsDir)) {
      throw new FlowStateError("FLOW_DIR_NO_EXISTE", `Directorio de flows no encontrado: ${flowsDir}`);
    }

const files = fs.readdirSync(flowsDir).filter((f) => f.endsWith(".json"));

const flows: Record<string, FlowDefinition> = {};

for (const file of files) {
  const full = path.join(flowsDir, file);
  const raw = fs.readFileSync(full, "utf8");
  let content: any;
  try {
    content = JSON.parse(raw);
  } catch (e) {
    console.warn(`[FlowLoader] Archivo JSON inválido, se omite: ${file}`);
    continue;
  }

  // Ignorar archivos que no tienen la forma de FlowDefinition
  const pareceFlowDef =
    content &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    typeof content.id === "string" &&
    content.id.length > 0 &&
    (typeof content.version === "string" || typeof content.version === "number") &&
    Array.isArray(content.nodos);

  if (!pareceFlowDef) {
    console.warn(`[FlowLoader] Archivo no reconocido como FlowDefinition, se omite: ${file}`);
    continue;
  }

  const def = content as FlowDefinition;
  FlowValidator.validateFlow(def);
  flows[def.id] = def;
}

return flows;


}
}


