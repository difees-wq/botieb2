

#!/usr/bin/env bash
set -e

echo "📦 Building Frontend Widget..."
pnpm --filter frontend-widget build

echo "📦 Creating bundle ZIP..."
cd frontend-widget/dist
zip -r ../../widget-bundle.zip .

echo "✓ Widget bundle created: widget-bundle.zip"

