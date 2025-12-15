

#!/usr/bin/env bash
echo "👉 Formatting entire monorepo..."
pnpm prettier --write .
pnpm eslint . --fix
echo "✓ Formatting complete."

