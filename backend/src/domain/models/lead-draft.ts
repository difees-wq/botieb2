

/**

LeadDraft contiene SOLO información NO SENSIBLE.

Nunca contiene email, teléfono ni nombre.
*/
export interface LeadDraft {
idSesion: string;

canalPreferido: string; // EMAIL | WHATSAPP | ...
aceptoGdpr: boolean;

citaFecha: string | null;
citaHora: string | null;

etiquetasInteres: string | null;
resumenConversacion: string | null;
}

