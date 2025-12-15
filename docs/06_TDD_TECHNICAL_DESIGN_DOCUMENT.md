CONTENT

DOC6 — TDD Technical Design Document

Este documento define:

Estrategia TDD

Tipos de tests

Estructura de carpetas

Librerías

Reglas obligatorias para tests

1. Principios TDD del proyecto

Cada service debe nacer con tests unitarios.

Cada bug debe generar un test que lo reproduzca.

Todos los flujos JSON deben tener tests de recorrido.

Las integraciones externas se mockean SIEMPRE.

Los controladores se testean como integración ligera (sin lógica).

2. Tipos de test
2.1 Unit tests

Ubicación: backend/test/unit/

Cubren services, flow engine, utils.

No acceden a BD.

BD mockeada mediante:

jest.mock("../../src/repositories/chat-session-repository");

2.2 Integration tests

Ubicación: backend/test/integration/

Requieren una BD real en Supabase:

variable: TEST_DATABASE_URL

Se ejecutan automáticamente:

beforeAll(initTestDb)
afterAll(closeTestDb)

2.3 E2E (opcional)

Cubren inicio-fin:

sesión → mensajes → lead creado.

3. Tests de flujo conversacional

Cada flujo se testea:

Carga del JSON

Transición válida entre nodos

Error esperado cuando:

nodo no existe

opción inválida

formulario incompleto

Lead creation logic

falta GDPR → NO lead

falta dato → formulario requerido

PII suficiente → Salesforce mock

4. Estructura de carpetas de test
backend/test/
  unit/
    services/
    flow/
    utils/

  integration/
    setup/
      test-db.ts
      mock-salesforce.ts

    session.int.spec.ts
    message.int.spec.ts
    lead.int.spec.ts
    flows.int.spec.ts

5. Librerías obligatorias

Jest

Supertest (para controllers)

pg (para BD)

ts-node para soporte TS tests

6. Mock de Salesforce
jest.mock("../../src/integrations/salesforce-client", () => ({
  SalesforceClient: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn().mockResolvedValue("FAKE_TOKEN"),
    createLead: jest.fn().mockResolvedValue("FAKE_LEAD_ID"),
    updateLead: jest.fn().mockResolvedValue("FAKE_UPDATED_ID")
  }))
}));

7. Coverage mínimo

Services: 90%

Flow Engine: 100% rutas críticas

Controllers: 70%

Repositories: NO obligatorio (se cubren por tests integración)

DOC7 — PROJECT GUIDE

DELIMITER

