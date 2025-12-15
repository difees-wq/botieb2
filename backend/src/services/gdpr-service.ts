

import { BusinessRuleError, ValidationError } from "../domain/errors";
import { LeadDraft } from "../domain/models/lead-draft";

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
