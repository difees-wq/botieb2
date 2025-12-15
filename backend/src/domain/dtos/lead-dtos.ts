

/**

DTO para recibir datos de lead desde el frontend

Contiene PII porque va DIRECTO a Salesforce (no a BD).
*/
export interface LeadInputDto {
canalPreferido: string;

nombre?: string;
apellidos?: string;
email?: string;
telefono?: string;

aceptoGdpr: boolean;

citaFecha?: string;
citaHora?: string;
}

export interface LeadEvaluationResult {
puedeCrearLead: boolean;
motivoBloqueo?: string;
fieldErrors?: Record<string, string>;
}

export interface LeadFlagsResult {
leadCreado: boolean;
requiereGDPR: boolean;
estadoLead: string;
leadSalesforceId?: string;
}

