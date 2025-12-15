
import { LeadService } from "../../src/services/lead-service";
import { GdprService } from "../../src/services/gdpr-service";
import { MockSalesforceService } from "../integration/setup/mock-salesforce";

const mockLeadDraftRepo = {
upsertBySession: jest.fn(),
deleteBySession: jest.fn()
};

const gdprService = new GdprService();
const sfService = new MockSalesforceService();

const leadService = new LeadService(
// @ts-expect-error - mock parcial
mockLeadDraftRepo,
// @ts-expect-error - mock parcial
sfService,
gdprService
);

const baseSession = {
idSesion: "sess-1",
visitanteHash: "hash",
urlOrigen: "https://www.ieb.es/programas/master/finanzas
",
tipoEstudio: "MASTER",
cursoSlug: "finanzas",
estadoFlujo: "CONTACTO",
leadSfId: null,
createdAt: new Date(),
updatedAt: new Date()
};

describe("LeadService", () => {
beforeEach(() => {
jest.clearAllMocks();
sfService.createdLeads = [];
sfService.shouldFail = false;
});

it("devuelve bloqueo si falta email cuando canal=EMAIL", async () => {
const result = await leadService.evaluate({
nombre: "Test",
apellidos: null,
email: null,
telefono: null,
canalPreferido: "EMAIL",
aceptoGdpr: true,
citaFecha: null,
citaHora: null
});

expect(result.puedeCrearLead).toBe(false);
expect(result.fieldErrors?.email).toBeDefined();


});

it("crea lead cuando se cumplen todos los requisitos", async () => {
const result = await leadService.processLead(baseSession as any, {
nombre: "Test",
apellidos: null,
email: "test@example.com
",
telefono: null,
canalPreferido: "EMAIL",
aceptoGdpr: true,
citaFecha: null,
citaHora: null
});

expect(result.leadCreado).toBe(true);
expect(result.leadSalesforceId).toBeDefined();
expect(sfService.createdLeads.length).toBe(1);


});
});

