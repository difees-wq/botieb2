CONTENT

DOC8 — Coding Standards (IEB Web Assistant)

Este documento establece las reglas obligatorias de estilo y calidad del código.

1. TypeScript
1.1 Configuración obligatoria
"strict": true,
"noImplicitAny": true,
"noUnusedLocals": true,
"noUnusedParameters": true

1.2 Tipado estricto

Nada de any (excepto casos aislados con comentario obligatorio).

Preferir type para estructuras complejas.

Preferir interface para DTOs.

2. Estructura por capas
controllers → services → repositories → integrations

Controllers

No contienen lógica.

Validan superficialmente.

Services

Lógica de negocio.

Reglas GDPR.

Orquestan flujos.

Repositories

Operaciones SQL.

Nada de lógica.

Integrations

Conexión SF.

Manejo de errores y reintentos.

3. Logging

Logger: pino

Nivel:

info → eventos estándar

warn → inconsistencias

error → fallos serios

No logs de:

email

teléfono

nombre

texto libre

direcciones

otros PII

4. Estándares de carpetas
Backend
src/
  api/
  services/
  repositories/
  integrations/
  domain/
  config/
  utils/

Frontend
src/
  core/
  ui/

5. Naming

CamelCase para variables

PascalCase para clases y interfaces

snake_case para base de datos

UPPER_CASE para constantes

6. Documentación mínima

Cada archivo debe tener encabezado mínimo:

/**
 * Nombre del módulo
 * Rol en la arquitectura
 */


FIN DOC8

📄 DOC9 — EVOLUTIVES

DELIMITER

