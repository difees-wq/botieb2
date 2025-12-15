
CONTENT
import request from "supertest";
import { buildApp } from "../../src/app";
import { loadAppConfig } from "../../src/config/app-config";

describe("Integración - POST /api/chatbot/lead/:idSesion", () => {
const app = buildApp(loadAppConfig());

async function createSession() {
const res = await request(app)
.post("/api/chatbot/session")
.send({
urlOrigen: "https://www.ieb.es/programas/master/finanzas
",
visitanteHash: "hash-lead-1"
});

return res.body.idSesion as string;


}

it("rechaza la creación de lead si falta email cuando canal=EMAIL", async () => {
const idSesion = await createSession();

const res = await request(app)
  .post(`/api/chatbot/lead/${idSesion}`)
  .send({
    nombre: "Test",
    canalPreferido: "EMAIL",
    aceptoGdpr: true
  });

expect(res.status).toBe(409);


});

it("acepta lead cuando se cumplen reglas mínimas", async () => {
const idSesion = await createSession();

const res = await request(app)
  .post(`/api/chatbot/lead/${idSesion}`)
  .send({
    nombre: "Test",
    email: "test@example.com",
    canalPreferido: "EMAIL",
    aceptoGdpr: true
  });

expect(res.status).toBe(200);
expect(res.body.leadCreado).toBe(true);
expect(res.body.leadSalesforceId).toBeDefined();


});
});

