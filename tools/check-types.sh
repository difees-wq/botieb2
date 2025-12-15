
#!/usr/bin/env bash
echo "🔎 Checking TypeScript types..."
pnpm tsc -b backend
pnpm tsc -b frontend-widget
echo "✓ Types OK"

