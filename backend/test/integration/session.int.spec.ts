
CONTENT
import request from "supertest";
import { buildApp } from "../../src/app";
import { loadAppConfig } from "../../src/config/app-config";

describe("Integración - POST /api/chatbot/session", () => {
const app = buildApp(loadAppConfig());

it("crea una sesión con urlOrigen válida", async () => {
const res = await request(app)
.post("/api/chatbot/session")
.send({
urlOrigen: "https://www.ieb.es/programas/master/finanzas
",
visitanteHash: "hash-test-123"
});

expect(res.status).toBe(201);
expect(res.body.idSesion).toBeDefined();
expect(res.body.tipoEstudio).toBeDefined();


});

it("devuelve 400 si falta urlOrigen", async () => {
const res = await request(app)
.post("/api/chatbot/session")
.send({});

expect(res.status).toBe(400);


});
});

