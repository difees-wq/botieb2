CONTENT

DOC10 — Developer Task Plan (IEB Web Assistant)

Este documento define el plan operativo para desarrolladores, tareas, responsables, priorización y resultados esperados.

1. Objetivo del documento

Servir como guía de trabajo técnico:

Qué tareas debe realizar un dev

Qué orden deben seguirse

Qué entregables debe generar

Qué criterios de completitud deben cumplirse

Qué validaciones deben hacerse antes de merge

2. Roadmap Técnico
2.1 Primera fase — Infraestructura base del sistema

 Repositorio con estructura inicial

 Migraciones SQL en Supabase

 Configuración inicial del backend

 Integración continua (CI)

 Setup de tests

2.2 Segunda fase — Backend

 Controllers (API Contract DOC3)

 Services (logic DOC11)

 Repositories (SQL DOC2)

 Flow Engine

 Integraciones Salesforce

 Logger

2.3 Tercera fase — Frontend Widget

 Core (state, session manager)

 UI renderer

 API client

 Bundling (webpack)

2.4 Cuarta fase — End to End

 Recorrido completo de flujo GRADO/MASTER/ONLINE

 Evaluación de lead

 GDPR

 Creación de lead en Salesforce

3. Definition of Done (DoD)

Una tarea se considera finalizada si:

✔ Código completado
✔ Tests completados
✔ Sin warnings de linter
✔ Documentación actualizada (si aplica)
✔ No se rompe API Contract
✔ No se introduce PII en BD
✔ Se respeta Implementation Style Guide (DOC11)
4. Checklist antes de merge

 Tests unitarios ejecutan correctamente

 Tests de integración pasan

 CI sin fallos

 Controlador sin lógica de negocio

 Service con reglas claras

 SQL seguro y parametrizado

 Flujo JSON válido

 Logging sin PII

 PR documentada con descripción clara

5. Flujos de trabajo recomendados
Git branching model

main → producción estable

develop → staging

feature/* → desarrollo

6. Comunicación

Toda duda arquitectónica debe resolverse según DOC5 (ADR).

FIN DOC10

📄 DOC11 — IMPLEMENTATION_STYLE_GUIDE.md (VINCULANTE)

DELIMITER

