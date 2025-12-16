

import { BusinessRuleError, ValidationError } from "../domain/errors.js";
import { LeadDraft } from "../domain/models/lead-draft.js";

export class GdprService {
validateAccepted(draft: LeadDraft) {
if (!draft.aceptoGdpr) {
throw new BusinessRuleError("GDPR_REQUIRED", "Debe aceptar los términos GDPR.");
}
}

validateChannel(draft: LeadDraft) {
if (draft.canalPreferido === "WHATSAPP" && !draft.resumenConversacion) {
throw new ValidationError("WHATSAPP_REQUIERE_RESUMEN", "Debe incluir resumen.");
}
}
}
