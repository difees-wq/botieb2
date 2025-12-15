CONTENT

DOC5 — Architecture Standards & ADR (IEB Web Assistant)

Este documento regula las decisiones arquitectónicas obligatorias del proyecto.

1. Estándares de arquitectura
1.1 Backend: Node.js + TypeScript + Express

Tipado estricto (strict: true)

Estructura limpia:

controllers -> services -> repositories -> integrations


Nada de lógica en controllers.

Nada de negocio en repositorios.

1.2 Base de datos: Supabase PostgreSQL

Única BD en todos los entornos.

Acceso solo vía pg.Pool.

Sin Supabase SDK.

Sin RLS, sin Auth.

SQL 100% estándar.

1.3 Integración con Salesforce

OAuth2 con usuario técnico.

Reintentos con backoff.

Manejo de errores consistente.

PII solo en SF.

1.4 Flow Engine basado en JSON

Los flujos del chatbot son inmutables, declarativos y versionados.

El backend no contiene flujos en código.

Se cargan desde /config/flows/*.json.

2. ADR — Decisiones arquitectónicas registradas
ADR-001 — Supabase como única BD

Contexto: se evaluó usar Postgres local para dev y Supabase para prod.

Decisión:
Se usa Supabase PostgreSQL en todos los entornos.

Consecuencias:

No hay docker-compose para Postgres.

Mismas migraciones para dev/staging/prod.

Conexión vía DATABASE_URL siempre.

ADR-002 — Backend sin frameworks pesados

Motivo: minimización de dependencias y facilidad de auditoría.

Decisión:
Usar Express + TypeScript + pg.

ADR-003 — Flow Engine declarativo JSON

Decisión:
Flows en JSON, sin “lógica condicional” en código.

ADR-004 — PII solo en Salesforce

Decisión:
Prohibido guardar PII en BD, logs o eventos.

Esto condiciona:

Sanitización de texto,

lead_draft sin PII,

message_log sin contenido sensible.

ADR-005 — DI manual

Decisión:
No usar frameworks DI (Inversify, NestJS...).

Razón:

Simplicidad

Trazabilidad

Testing directo

ADR-006 — Logging estructurado sin PII

Decisión:
Logger pino → JSON limpio → nada de PII.

ADR-007 — Tests sin Postgres local

Decisión:
Tests unitarios mockean BD.
Tests de integración utilizan:

una BD temporal en Supabase,

o TEST_DATABASE_URL.

FIN DOC5

📄 DOC6 — TDD & TEST DESIGN

DELIMITER

