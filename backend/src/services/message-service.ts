
import { ChatSessionRepository } from "../repositories/chat-session-repository.js";
import { FlowService } from "./flow-service.js";
import { LeadService } from "./lead-service.js";
import { LoggingService } from "./logging-service.js";
import { EntradaUsuario, MessageResponseDto } from "../domain/dtos/message-dtos.js";
import { CourseCatalogService } from "./course-catalog-service.js";
import { NotFoundError } from "../domain/errors.js";

export class MessageService {
constructor(
  private readonly chatRepo: ChatSessionRepository,
  private readonly flow: FlowService,
  private readonly lead: LeadService,
  private readonly log: LoggingService,
  private readonly courseCatalog: CourseCatalogService
) {}

async handleMessage(idSesion: string, input: EntradaUsuario): Promise<MessageResponseDto> {
const session = await this.chatRepo.findById(idSesion);
if (!session) throw new NotFoundError("SESION_NO_EXISTE", "Sesión no encontrada");

await this.log.message(idSesion, "USER", JSON.stringify(input));

const { node, nodeId } = this.flow.resolveNext(session, input);

// LISTA_CURSOS: construir opciones dinámicas
let opciones: any[] = node.opciones ?? [];
if ((node as any).tipo === "LISTA_CURSOS") {
  const categoria = (node as any).categoriaFlujo || "";
  const cursos = this.courseCatalog.getByCategoriaFlujo(categoria);
  opciones = cursos.map(c => ({ valor: c.slug, texto: c.nombre })); // estructura solicitada
}

// Selección de curso: input BOTON con slug válido
if (input.tipo === "BOTON" && this.courseCatalog.getBySlug(String(input.valor))) {
  const curso = this.courseCatalog.getBySlug(String(input.valor));
  if (curso) {
    // Actualizar sesión en memoria
    session.cursoSlug = curso.slug;
    // Guardar nombre y tipoEstudio sin cambiar repositorio (limitación solicitada)
    (session as any).cursoNombre = curso.nombre;
    (session as any).tipoEstudio = curso.categoriaFlujo.startsWith("MASTER")
      ? "MASTER"
      : curso.categoriaFlujo.includes("ONLINE")
        ? "ONLINE" : (curso.categoriaFlujo === "GRADO" ? "GRADO" : "DESCONOCIDO");
  }
}
await this.chatRepo.updateFlowState(idSesion, nodeId, session.leadSfId);

await this.log.message(
  idSesion,
  "BOT",
  JSON.stringify({ tipo: node.tipo, titulo: node.titulo })
);

return {
  siguientePaso: {
    tipo: (node as any).tipo === "LISTA_CURSOS" ? "BOTONERA" : node.tipo,
    titulo: node.titulo,
    texto: node.texto ?? null,
    opciones,
    camposFormulario: node.camposFormulario ?? []
  },
  flags: {
    leadCreado: false,
    requiereGDPR: false,
    estadoLead: "NO_INICIADO"
  }
};


}
}

