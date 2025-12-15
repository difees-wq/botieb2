
#!/usr/bin/env bash
set -e

echo "🚀 Aplicando migraciones SQL a Supabase..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL no definido."
  exit 1
fi

for file in backend/db/migrations/*.sql; do
  echo "▶ Ejecutando: $file"
  psql "$DATABASE_URL" -f "$file"
done

echo "✅ Migraciones aplicadas correctamente."


