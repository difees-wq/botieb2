
# === Backend ===

backend-install:
	pnpm --filter backend install

backend-dev:
	pnpm --filter backend dev

backend-test:
	pnpm --filter backend test

backend-lint:
	pnpm --filter backend lint

backend-build:
	pnpm --filter backend build

# === Frontend ===

widget-install:
	pnpm --filter frontend-widget install

widget-build:
	pnpm --filter frontend-widget build

widget-dev:
	pnpm --filter frontend-widget dev

# === All project ===

install:
	pnpm install

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

🔐 Infraestructura adicional
