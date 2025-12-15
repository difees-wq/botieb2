
import request from "supertest";
import { buildApp } from "../../src/app";
import { loadAppConfig } from "../../src/config/app-config";
import { describe, it, expect } from "@jest/globals";

describe("Integración - POST /api/chatbot/message/:idSesion", () => {
const app = buildApp(loadAppConfig());

async function createSession() {
  const res = await request(app)
    .post("/api/chatbot/session")
    .send({
      urlOrigen: "https://www.ieb.es/programas/master/finanzas",
      visitanteHash: "hash-msg-1"
    });
  return res.body.idSesion as string;
}

it("avanza el flujo con una entrada de BOTON válida", async () => {
  const idSesion = await createSession();
  const res = await request(app)
    .post(`/api/chatbot/message/${idSesion}`)
    .send({
      tipo: "BOTON",
      valor: "DUDAS_GENERALES"
    });
  expect(res.status).toBe(200);
  expect(res.body.siguientePaso).toBeDefined();
  expect(res.body.siguientePaso.tipo).toBeDefined();
});
});

