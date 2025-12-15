

import { FlowEngine } from "../../src/flow-engine/flow-engine";
import { FlowDefinition } from "../../src/flow-engine/flow-node-types";
import { ChatSession } from "../../src/domain/models/chat-session";

const simpleFlow: FlowDefinition = {
id: "MASTER",
version: "1.0.0",
nodos: [
{
id: "INICIO",
tipo: "BOTONERA",
titulo: "Inicio",
opciones: [
{ id: "A", label: "Opción A" },
{ id: "B", label: "Opción B" }
],
next: { A: "NODO_A", B: "NODO_B" }
},
{
id: "NODO_A",
tipo: "INFO",
titulo: "A",
texto: "Has elegido A",
next: "FIN"
},
{
id: "NODO_B",
tipo: "INFO",
titulo: "B",
texto: "Has elegido B",
next: "FIN"
},
{
id: "FIN",
tipo: "INFO",
titulo: "Fin",
texto: "Fin",
next: "FIN"
}
]
};

describe("FlowEngine", () => {
const engine = new FlowEngine({ MASTER: simpleFlow });

const baseSession: ChatSession = {
idSesion: "sess-1",
visitanteHash: "hash",
urlOrigen: "https://www.ieb.es
",
tipoEstudio: "MASTER",
cursoSlug: null,
estadoFlujo: "INICIO",
leadSfId: null,
createdAt: new Date(),
updatedAt: new Date()
};

it("calcula siguiente nodo para BOTON válido", () => {
const { nextNode, nextNodeId } = engine.computeNext(baseSession, {
tipo: "BOTON",
valor: "A",
campos: null
});

expect(nextNodeId).toBe("NODO_A");
expect(nextNode.id).toBe("NODO_A");


});

it("lanza error para opción de botón inválida", () => {
expect(() =>
engine.computeNext(baseSession, {
tipo: "BOTON",
valor: "INVALID",
campos: null
})
).toThrow();
});
});

