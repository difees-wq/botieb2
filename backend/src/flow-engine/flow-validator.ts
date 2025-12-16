import { FlowDefinition, FlowNode } from "./flow-node-types.js";
import { FlowStateError } from "../domain/errors.js";

export class FlowValidator {
  static validateFlow(def: FlowDefinition): void {
  if (!def.id) throw new FlowStateError("FLOW_SIN_ID", "Flow sin ID");
  if (!def.version) throw new FlowStateError("FLOW_SIN_VERSION", "Flow sin version");

    if (!Array.isArray(def.nodos) || def.nodos.length === 0) {
  throw new FlowStateError("FLOW_SIN_NODOS", `Flow ${def.id} sin nodos`);
    }

    const ids = new Set<string>();

    for (const node of def.nodos) {
      this.validateNode(node);

      if (ids.has(node.id)) {
  throw new FlowStateError("NODO_DUPLICADO", `Nodo duplicado: ${node.id}`);
      }
      ids.add(node.id);
    }
  }

  private static validateNode(node: FlowNode): void {
  if (!node.id) throw new FlowStateError("NODO_SIN_ID", "Nodo sin id");
  if (!node.tipo) throw new FlowStateError("NODO_SIN_TIPO", `Nodo ${node.id} sin tipo`);
  if (!node.titulo) throw new FlowStateError("NODO_SIN_TITULO", `Nodo ${node.id} sin titulo`);

    // BOTONERA
    if (node.tipo === "BOTONERA") {
      if (!Array.isArray(node.opciones) || node.opciones.length === 0) {
  throw new FlowStateError("NODO_SIN_OPCIONES", `Nodo ${node.id} sin opciones`);
      }
      if (typeof node.next !== "object") {
        throw new FlowStateError("BOTONERA_SIN_MAP", `Nodo ${node.id} BOTONERA requiere next map`);
      }
    }

    // FORM
    if (node.tipo === "FORM") {
      if (
        !Array.isArray(node.camposFormulario) ||
        node.camposFormulario.length === 0
      ) {
        throw new FlowStateError("FORM_SIN_CAMPOS", `Nodo ${node.id} sin camposFormulario`);
      }
      if (typeof node.next !== "string") {
        throw new FlowStateError("FORM_SIN_NEXT", `Nodo ${node.id} FORM requiere next string`);
      }
    }

    // INFO
    if (node.tipo === "INFO") {
      if (!node.texto) {
        throw new FlowStateError("INFO_SIN_TEXTO", `Nodo INFO ${node.id} sin texto`);
      }

      // Permitimos next = null como nodo final, pero no undefined
      if (node.next === undefined) {
        throw new FlowStateError("INFO_SIN_NEXT", `Nodo INFO ${node.id} sin next`);
      }
    }

    // DYNAMIC (nuevo soporte)
    if (node.tipo === "DYNAMIC") {
      if (!node.dynamicQuery || typeof node.dynamicQuery !== "string") {
        throw new FlowStateError("DYNAMIC_SIN_QUERY", `Nodo DYNAMIC ${node.id} sin dynamicQuery`);
      }
      if (typeof node.next !== "string") {
        throw new FlowStateError("DYNAMIC_SIN_NEXT", `Nodo DYNAMIC ${node.id} requiere next string`);
      }
    }

  }
}
