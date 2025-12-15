
#!/usr/bin/env bash

echo "🧪 Ejecutando test suite completa..."

export NODE_ENV=test

pnpm --filter backend test
pnpm --filter frontend-widget test

echo "✅ Tests completados."




