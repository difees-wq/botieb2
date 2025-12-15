
# Contributing Guide

¡Gracias por querer contribuir!

Este proyecto sigue estrictamente los documentos:

- DOC01 — DOC11
- Implementation Style Guide
- Project Guide
- Architecture Standards

## Reglas básicas

- Ningún PR puede romper DOC11.
- No agregar lógica de negocio en controladores.
- No guardar PII fuera de Salesforce.
- Asegurar lint + tests antes de PR.
- Cualquier cambio en flujos → actualizar DOC9 (Evolutivos).

## Workflow
1. Crear rama feature/xxxx
2. Realizar cambios siguiendo TDD
3. Ejecutar:


pnpm lint
pnpm test

4. Crear PR con plantilla estándar (DOC10)
5. Esperar revisión del arquitecto

