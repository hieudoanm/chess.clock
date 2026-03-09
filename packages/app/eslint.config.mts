import { defineConfig, globalIgnores } from 'eslint/config';
import path from 'node:path';

export default defineConfig([
	globalIgnores([
		'.next/**',
		'build/**',
		'docs/**',
		'mobile/**',
		'node_modules/**',
		'out/**',
		'src/generated/**',
		'src-tauri/**',
		'next-env.d.ts',
		'jest.config.ts',
		'jest.setup.ts',
	]),
]);
