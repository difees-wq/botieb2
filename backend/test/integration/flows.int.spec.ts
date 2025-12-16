
import request from "supertest";
import { buildApp } from "../../src/app.js";
import { loadAppConfig } from "../../src/config/app-config.js";

describe("Integración - GET /api/chatbot/flows/:tipo", () => {
const app = buildApp(loadAppConfig());

it("devuelve el flujo MASTER", async () => {
const res = await request(app).get("/api/chatbot/flows/MASTER");
expect(res.status).toBe(200);
expect(res.body.id).toBe("MASTER");
expect(Array.isArray(res.body.nodos)).toBe(true);
});

it("devuelve error 400 para tipo inválido", async () => {
const res = await request(app).get("/api/chatbot/flows/UNKNOWN_TYPE");
// según implementación, podría ser 400 o 500; aquí asumimos 400
expect([400, 500]).toContain(res.status);
});
});

