

import { LeadDraftRepository } from "../repositories/lead-draft-repository";
import { SalesforceService } from "../integrations/salesforce-service";
import { LeadInputDto, LeadEvaluationResult, LeadFlagsResult } from "../domain/dtos/lead-dtos";
import { ChatSession } from "../domain/models/chat-session";
import { GdprService } from "./gdpr-service";
import { BusinessRuleError } from "../domain/errors";
import { SalesforceClient, LeadPayload } from "../integrations/salesforce-client";

export class LeadService {
constructor(
private readonly repo: LeadDraftRepository,
private readonly sf: SalesforceService,
private readonly gdpr: GdprService
) {}

  /**
   * Construye el payload válido para Salesforce Lead.
   * Solo incluye los campos aprobados:
   *   FirstName, LastName, Email, Phone,
   *   Study_of_interest__c, Contactar_por__c, Source__c, OK_Privacy_Policies__c
   * - Study_of_interest__c se obtiene de input.studyOfInterest (no declarado en el DTO oficial todavía).
   * - Contactar_por__c se valida contra los 3 valores permitidos.
   * - OK_Privacy_Policies__c siempre true.
   */
  private buildLeadPayload(input: LeadInputDto): Record<string, any> {
    // Valores permitidos finales para Contactar_por__c
    const allowedContactValues = new Set(["Llamada", "Correo electrónico", "Whatsapp"]);

    // Mapeo desde canalPreferido (posibles valores legacy) -> valor Salesforce
    const map: Record<string, string> = {
      "LLAMADA": "Llamada",
      "EMAIL": "Correo electrónico",
      "WHATSAPP": "Whatsapp",
      // Si en algún momento ya viene normalizado podemos aceptarlo directamente
      "Llamada": "Llamada",
      "Correo electrónico": "Correo electrónico",
      "Whatsapp": "Whatsapp"
    };

    const rawPreferido = (input.canalPreferido || "").trim();
    const contacto = map[rawPreferido];
    if (!contacto || !allowedContactValues.has(contacto)) {
      throw new BusinessRuleError("CONTACTAR_POR_INVALIDO", `Valor inválido para Contactar_por__c: '${rawPreferido}'`);
    }

    // studyOfInterest se obtiene sin añadir campo al DTO para no modificar otros archivos
    const studyOfInterest = (input as any).studyOfInterest || "";

    return {
      FirstName: input.nombre ?? "",
      LastName: input.apellidos ?? "",
      Email: input.email ?? undefined,
      Phone: input.telefono ?? undefined,
      Study_of_interest__c: studyOfInterest,
      Contactar_por__c: contacto,
      Source__c: "Chatweb",
      OK_Privacy_Policies__c: true
    };
  }

evaluate(input: LeadInputDto): LeadEvaluationResult {
const errors: Record<string, string> = {};

if (input.canalPreferido === "EMAIL" && !input.email) errors.email = "EMAIL_REQUERIDO";
if (input.canalPreferido === "WHATSAPP" && !input.telefono) errors.telefono = "TELEFONO_REQUERIDO";

if (Object.keys(errors).length === 0) {
  return { puedeCrearLead: true };
}

return {
  puedeCrearLead: false,
  motivoBloqueo: "CAMPOS_INCOMPLETOS",
  fieldErrors: errors
};


}

async process(session: ChatSession, input: LeadInputDto): Promise<LeadFlagsResult> {
const evalResult = this.evaluate(input);

if (!evalResult.puedeCrearLead) {
  return {
    leadCreado: false,
    requiereGDPR: false,
    estadoLead: "NO_INICIADO"
  };
}

// Validaciones GDPR
this.gdpr.validateAccepted({
  idSesion: session.idSesion,
  canalPreferido: input.canalPreferido,
  aceptoGdpr: input.aceptoGdpr,
  citaFecha: input.citaFecha ?? null,
  citaHora: input.citaHora ?? null,
  etiquetasInteres: null,
  resumenConversacion: null
});

// Construir payload con campos estrictamente permitidos
const leadPayload = this.buildLeadPayload(input);
// Incluir siempre el email en ambos campos del Lead
leadPayload.Email = input.email ?? undefined;
leadPayload.Email__c = input.email ?? undefined;
const idLeadSF = await this.sf.createLead(leadPayload);

await this.repo.deleteBySession(session.idSesion);

return {
  leadCreado: true,
  requiereGDPR: false,
  estadoLead: "CREADO",
  leadSalesforceId: idLeadSF
};


}
  
  /**
   * Crea un Lead en Salesforce usando el estado del chatbot (nuevo flujo).
   * Utiliza SalesforceClient (refresh_token → access_token) y envía los API Names exactos.
   */
  async createLeadFromChatbot(state: any, visitorHash: string, contactMethod: string): Promise<string> {
    console.log("====== DEBUG LeadService (entrada) ======");
    console.log("[LeadService] state.email recibido:", state?.email);
    console.log("=========================================");

    const payload: LeadPayload & Record<string, any> = {
      FirstName: state?.name ?? "",
      LastName: state?.lastName ?? "",
      Email: state?.email ?? "",
      Phone: state?.phone ?? "",
      Company: "Particular",
      Study_of_interest__c: state?.selectedStudyInterest ?? null,
      Curso__c: state?.selectedCourseSfId ?? null,
      A_o_de_inter_s__c: String(state?.selectedYear ?? ""),
      Application_date__c: new Date().toISOString().slice(0, 10),
      Contactar_por__c: contactMethod,
      LeadSource: "ChatWeb",
      Description:
        `info id chatweb: ${visitorHash} – curso SFID: ${state?.selectedCourseSfId ?? ""} (${state?.selectedCourseName ?? ""}) – año: ${state?.selectedYear ?? ""}` +
        (state?.userComment ? `\n\nComentario del usuario:\n${state.userComment}` : "")
    };

    // Duplicar email en ambos campos antes de enviar
    payload.Email = state?.email ?? "";
    (payload as any).Email__c = state?.email ?? "";
    payload.OK_Privacy_Policies__c = state?.acceptedPrivacy === "Aceptar";

    console.log(
      "[LeadService.createLeadFromChatbot] payload:",
      JSON.stringify(payload, null, 2)
    );

    const sfClient = new SalesforceClient();
    const leadId = await sfClient.createLead(payload);

    return leadId;
  }
}


// Backwards compatibility wrapper expected by LeadController (processLead)
export interface LeadServiceCompat extends LeadService {}

(LeadService as any).prototype.processLead = function(session: ChatSession, input: LeadInputDto) {
  return (this as LeadService).process(session, input);
};
