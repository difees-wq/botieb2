CONTENT

DOC4 — Security Specification (IEB Web Assistant)

Este documento define todos los controles de seguridad aplicables al backend, frontend y a las integraciones del IEB Web Assistant.

El objetivo es garantizar:

Protección de PII (Salesforce-only)

Integridad del flujo

Control de acceso a la API

Auditoría y logging seguro

Configuración de Supabase sin brechas

1. PRINCIPIOS GENERALES DE SEGURIDAD
1.1 PII solo en Salesforce

La PII NO se almacena en el backend ni en Supabase PostgreSQL.

PII incluye:

nombre

apellidos

email

teléfono

DNI/pasaporte

direcciones

textos libres

Las conversaciones NO deben incluir texto libre del usuario:

Si se recibe texto libre → se sanitiza y se trunca.

No se almacena contenido sensible.

1.2 Supabase PostgreSQL

Se usa como Postgres estándar, sin RLS ni Auth de Supabase.

Se accede solamente mediante pg.Pool.

Acceso restringido por IP:

backend server

entorno de CI/CD (si aplica)

Las tablas solo contienen datos NO sensibles.

1.3 Backend

HTTPS obligatorio.

CORS altamente restrictivo:

Solo dominios oficiales:

https://www.ieb.es

https://ieb.es

subdominios necesarios para preview en WordPress si se autorizan.

Tokens de Salesforce en variables de entorno.

Ningún secreto existe dentro del repositorio.

1.4 Frontend Widget

No contiene lógica de negocio.

No ejecuta operaciones sensibles.

No almacena datos personales.

No expone claves ni endpoints administrativos.

2. AUTENTICACIÓN Y AUTORIZACIÓN
2.1 API pública (nivel de chatbot)

El chatbot es anónimo, por lo que su API es pública pero protegida.

Controles:
✔ CORS — obligatorio
origin: ["https://www.ieb.es", "https://ieb.es"]

✔ Cabecera opcional de seguridad

X-CHATBOT-KEY: <token>

✔ Rate-limit (mínimo)

60 req / minuto / IP

200 req / minuto / visitanteHash

✔ Protección contra:

Repetición de mensajes

Sesiones inexistentes

Manipulación de estado del flujo

2.2 Integración con Salesforce

Acceso basado en OAuth2 + usuario técnico.

Tokens almacenados únicamente en process.env.

En producción se recomienda un Secret Manager externo.

3. VALIDACIÓN DE ENTRADA
3.1 Reglas generales

Toda entrada del usuario debe pasar:

Capa	Validación
Frontend Widget	Validación superficial (tipo de dato)
Controllers	Validación mínima (estructura)
Services	Validación profunda (negocio)
3.2 Sanitización

Truncado de cadenas > 200 caracteres.

Eliminación de HTML/JS.

Prohibido almacenar texto libre del usuario.

3.3 Validación de GDPR

aceptoGdpr === true obligatorio para crear lead.

Regla validada en GdprService.

4. SEGURIDAD DE BASE DE DATOS
4.1 Conexión segura

DATABASE_URL solo sobre TLS.

Si SUPABASE_SSL=true → ssl: { rejectUnauthorized: false }.

4.2 SQL parametrizado

Todas las queries deben tener formato:

SELECT * FROM tabla WHERE id = $1


Nunca concatenar strings.

4.3 Auditoría mínima
Logs NO sensibles:

creación de sesión

transición de flujo

errores de Salesforce

errores internos

Logs prohibidos:

❌ emails
❌ teléfonos
❌ nombres
❌ texto libre del usuario

5. SEGURIDAD DEL FLUJO (Flow Engine)
5.1 Validaciones

Nodo inexistente → error 422.

Transición no permitida → error 422.

Formulario con campos no esperados → error 400.

5.2 Protección

Evitar salto arbitrario de nodos.

Evitar “inyectar” datos en el flujo.

6. SEGURIDAD DEL FRONTEND

No expone claves.

No requiere autenticación.

Limita el tamaño de mensajes.

Carga el widget solo desde dominios permitidos.

No guarda PII en localStorage.

7. SEGURIDAD EN DESPLIEGUE
✔ Variables de entorno en dotenv o secret manager
✔ Revisión de cambios de flujos (DOC9)
✔ CI/CD con análisis estático (ESLint + TypeScript)
✔ Dependabot / npm audit
8. AMENAZAS Y MITIGACIONES (THREAT MODEL)
Amenaza	Mitigación
SQL Injection	pg.Pool + parametrización
XSS en widget	Sanitización + no renderizar HTML de usuario
Replay de requests	visitanteHash + sesión + rate-limit
Acceso indebido a BD	IP restrictions Supabase
Token SF comprometido	variables de entorno seguras
Manipulación de flujo	FlowService verifica todas las transiciones
Exfiltración PII	PII no existe en BD/logs

FIN DOC4

📄 DOC5 — ARCHITECTURE STANDARDS & ADR

DELIMITER

