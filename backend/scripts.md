
# Scripts Backend

### Desarrollo
pnpm dev  
Inicia el servidor con ts-node-dev.

### Lint
pnpm lint

### Tests
pnpm test
pnpm test:unit
pnpm test:integration

### SQL
pnpm db:migrate  
Ejecuta migraciones SQL en Supabase.

pnpm db:reset  
Resetea tablas NO-PII (message_log, event_log…).

### Build
pnpm build  
Compila a dist/.

