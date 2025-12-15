
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	// Solo ejecutar tests bajo backend/core
	roots: ['<rootDir>/core'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	// Limitar patrón de tests a .spec.ts dentro de core
	testMatch: ['**/__tests__/**/*.spec.ts', '**/*.spec.ts'],
	// Soporte ESM si el proyecto usa "type": "module"
	globals: {
		'ts-jest': {
			useESM: true
		}
	}
};

