CONTENT

DOC9 — Evolutivos de negocio y proceso de cambio

Este documento regula cómo se incorporan evolutivos (cambios de negocio, nuevos flujos, nuevos nodos, nuevas integraciones).

1. Proceso de un evolutivo
Paso 1 — Crear Issue “Evolutivo-X”

Describir:

Objetivo

Justificación

Impacto esperado

Cambios previstos

Paso 2 — Aprobación arquitecto

Validar impacto en:

Flujos JSON

Servicios

Repositorios

Integraciones

Seguridad

Paso 3 — Implementación en este orden:

Actualizar flujos JSON (si aplica)

Services

Repositories

Integrations

Controllers

Tests

Documentación

2. Reglas obligatorias al implementar un evolutivo

No romper API pública.

No introducir PII en BD.

Mantener compatibilidad HEDA (Salesforce).

Mantener diccionario de nodos / rutas del flujo.

Cualquier cambio en flujos se versiona en el archivo JSON.

3. Tipos de evolutivos permitidos

Nuevos nodos en flujos

Nuevos formularios

Nuevos canales (ej. WhatsApp → ya contemplado)

Nuevos tipos de estudio

Nueva lógica GDPR

Integración con nuevos sistemas externos

Reglas avanzadas de priorización de leads

4. Revisión obligatoria
Antes del merge deben revisarse:

JSON válido

Tests actualizados

Seguridad no rota

Supabase migraciones (si procede)

Compatibilidad con Salesforce

DOC10 — DEVELOPER_TASK_PLAN.md

DELIMITER

