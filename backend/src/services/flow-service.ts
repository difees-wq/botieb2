
import { FlowDefinition, FlowNode } from "../domain/dtos/flow-dtos.js";
import { FlowStateError, ValidationError } from "../domain/errors.js";
import { ChatSession } from "../domain/models/chat-session.js";
import { EntradaUsuario } from "../domain/dtos/message-dtos.js";

export class FlowService {
constructor(private readonly flows: Record<string, FlowDefinition>) {}

private getNode(flowId: string, nodeId: string): FlowNode {
  const flow = this.flows[flowId];
  if (!flow) {
    throw new FlowStateError("FLUJO_NO_ENCONTRADO", `Flujo no encontrado: ${flowId}`);
  }

  const node = flow.nodos.find(n => n.id === nodeId);
  if (!node) {
    throw new FlowStateError("NODO_NO_ENCONTRADO", `Nodo no encontrado: ${nodeId}`);
  }

  return node;
}


resolveNext(session: ChatSession, input: EntradaUsuario): { node: FlowNode; nodeId: string } {
const flowId = session.tipoEstudio;
const nodeActual = this.getNode(flowId, session.estadoFlujo);

if (!nodeActual.next) {
  throw new FlowStateError(
  "NODO_SIN_TRANSICIONES",
  "Nodo sin transiciones definidas"
);

}

if (input.tipo === "BOTON") {
  if (typeof nodeActual.next !== "object") {
    throw new ValidationError("TRANSICION_INVALIDA", "No acepta botones");
  }

  const destino = nodeActual.next[input.valor];
  if (!destino) {
    throw new ValidationError("OPCION_INVALIDA", "Opción no válida");
  }

  return { node: this.getNode(flowId, destino), nodeId: destino };
}

if (input.tipo === "FORM") {
  if (typeof nodeActual.next !== "string") {
    throw new ValidationError("TRANSICION_INVALIDA", "No acepta formularios");
  }

  return { node: this.getNode(flowId, nodeActual.next), nodeId: nodeActual.next };
}

throw new FlowStateError(
  "TIPO_ENTRADA_DESCONOCIDO",
  "Tipo de entrada no reconocido"
);



}
}

