import { FlowDefinition, FlowNode } from "./flow-node-types";
import { EntradaUsuario } from "../domain/dtos/message-dtos";
import { FlowStateError, ValidationError } from "../domain/errors";
import { ChatSession } from "../domain/models/chat-session";

export class FlowEngine {
  constructor(private readonly flows: Record<string, FlowDefinition>) {}

  getFlowDefinition(id: string): FlowDefinition {
    const f = this.flows[id];
  if (!f) throw new FlowStateError("FLUJO_NO_ENCONTRADO", `Flujo no encontrado: ${id}`);
    return f;
  }

  getNode(flowId: string, nodeId: string): FlowNode {
    const flow = this.getFlowDefinition(flowId);
    const node = flow.nodos.find((n) => n.id === nodeId);
  if (!node) throw new FlowStateError("NODO_NO_ENCONTRADO", `Nodo ${nodeId} no existe en ${flowId}`);
    return node;
  }

  computeNext(
    session: ChatSession,
    input: EntradaUsuario
  ): { nextNode: FlowNode; nextNodeId: string } {
    const flowId = session.tipoEstudio;
    const node = this.getNode(flowId, session.estadoFlujo);

    // Nuevo soporte: nodos DYNAMIC avanzan siempre a su next (string)
    if (node.tipo === "DYNAMIC") {
      if (typeof node.next !== "string") {
        throw new FlowStateError("DYNAMIC_NEXT_INVALIDO", `Nodo DYNAMIC ${node.id} requiere next string`);
      }
      const destino = node.next;
      const nextNode = this.getNode(flowId, destino);
      return { nextNode, nextNodeId: destino };
    }

    if (input.tipo === "BOTON") {
      if (typeof node.next !== "object") {
  throw new ValidationError("TRANSICION_INVALIDA", "El nodo no acepta botones");
      }

      const destino = node.next[input.valor];
      if (!destino) {
  throw new ValidationError("OPCION_INVALIDA", "La opción no existe");
      }

      const nextNode = this.getNode(flowId, destino);
      return { nextNode, nextNodeId: destino };
    }

    if (input.tipo === "FORM") {
      if (typeof node.next !== "string") {
  throw new ValidationError("TRANSICION_INVALIDA", "El nodo no acepta formularios");
      }

      const destino = node.next;
      const nextNode = this.getNode(flowId, destino);
      return { nextNode, nextNodeId: destino };
    }

  throw new FlowStateError("ENTRADA_DESCONOCIDA", "Entrada de usuario no reconocida");
  }
}
