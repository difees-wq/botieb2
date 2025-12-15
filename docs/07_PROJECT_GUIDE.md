CONTENT

DOC7 — Project Guide (IEB Web Assistant)

Este documento explica cómo se trabaja dentro del proyecto, el flujo de trabajo recomendado y las normas operativas para desarrolladores, DevOps y testers.

1. Filosofía del proyecto

El IEB Web Assistant es un proyecto clean-architecture, con:

Dominio claro (DTOs, modelos, tipos)

Servicios responsables de la lógica

Controllers ultra simples

Repositorios SQL

Integraciones externas encapsuladas

Flows JSON declarativos

Zero-PII storage

Supabase PostgreSQL como única base de datos

2. Estructura del repositorio
/
  backend/
    src/
      api/
      services/
      repositories/
      domain/
      config/
      utils/
      integrations/
      flow-engine/
    test/
      unit/
      integration/
    db/
      migrations/
    package.json
    tsconfig.json

  frontend-widget/
    src/
      core/
      ui/
    dist/
    package.json

  config/
    flows/
    catalog.json
    app-config.json

  docs/
    DOC1–DOC11

  README.md

3. Normas de contribución
3.1 Estilo de commit

Conventional Commits

feat:

fix:

refactor:

docs:

chore:

Ejemplo:

feat(flow): add new node to MASTER flow

3.2 Pull Requests

Cada PR debe incluir:

Objetivo

Cambios realizados

Implementación

Tests incluidos

Checklist (DOC10)

4. Flujo de trabajo para developers
Paso 1 — Leer DOC11 (Implementation Style Guide)
Paso 2 — Crear issue
Paso 3 — Crear branch
Paso 4 — Implementar siguiendo:
controllers → services → repositories → integrations

Paso 5 — Tests

Unitarios obligatorios

Integración si cambia persistencia

Paso 6 — PR + review
Paso 7 — Merge cuando CI pase
5. Reglas inamovibles

Nunca guardar PII en BD.

Nunca poner reglas de negocio en controllers.

Nunca modificar flujos en código.

Siempre SQL parametrizado.

Siempre logs sin PII.

6. Versionado de API

Cambios breaking → /v2, /v3, …

Cambios menores → no versionado.

FIN DOC7

📄 DOC8 — CODING STANDARDS

DELIMITER

