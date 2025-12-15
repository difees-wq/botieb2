
IEB Web Assistant – Monorepo

Este repositorio contiene todo el código y la configuración del IEB Web Assistant, el chatbot web embebido en la web del IEB que guía a futuros estudiantes y genera leads cualificados en Salesforce.

Estructura del repositorio
.
├─ backend/               # API Node.js + TypeScript (Express)
├─ frontend-widget/       # Widget JS embebible en WordPress
├─ config/
│  ├─ flows/              # Flujos conversacionales en JSON
│  └─ courses/            # Catálogo de cursos (JSON)
├─ docs/                  # Documentación oficial DOC1–DOC11
└─ backend/db/migrations/ # Migraciones SQL (Supabase PostgreSQL)

Tecnologías principales

Backend

Node.js 20+

TypeScript

Express

pg (PostgreSQL estándar)

Base de datos

Supabase PostgreSQL (única BD para todos los entornos)

Frontend

JavaScript/TypeScript

Widget ligero embebible en WordPress

CRM

Salesforce (HEDA / Lead)

Principios clave

PII solo en Salesforce (nombre, email, teléfono, etc.).

La BD en Supabase almacena solo:

sesiones

logs

eventos

mensajes sin PII

estados de flujo / lead draft sin datos sensibles.

Toda la lógica de negocio vive en el backend:

flujos

reglas GDPR

obligatoriedad de campos

creación de leads.

Los flujos del chatbot se definen solo en JSON (config/flows/*.json).

Puesta en marcha rápida

Clonar el repositorio.

Configurar variables de entorno (ver .env.example).

Instalar dependencias:

cd backend
npm install

cd ../frontend-widget
npm install


Ejecutar migraciones SQL contra Supabase (ver backend/db/migrations).

Levantar backend:

cd backend
npm run dev


Levantar widget (modo desarrollo/preview):

cd frontend-widget
npm run dev

Documentación

Toda la documentación arquitectónica y de implementación está en docs/:

01_ARCHITECTURE_C4.md

02_DATA_MODEL_PERSISTENCE.md

03_API_CONTRACT.md

04_SECURITY_SPEC.md

05_ARCHITECTURE_STANDARDS_ADR.md

06_TDD_TECHNICAL_DESIGN_DOCUMENT.md

07_PROJECT_GUIDE.md

08_CODING_STANDARDS.md

09_EVOLUTIVES.md

10_DEVELOPER_TASK_PLAN.md

11_IMPLEMENTATION_STYLE_GUIDE.md

