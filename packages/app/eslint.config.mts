import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';
import path from 'node:path';

export default defineConfig([
	...nextVitals,
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
	{
		rules: {
			'react-hooks/set-state-in-effect': 'off',
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: path.resolve(import.meta.dirname),
			},
		},
	},
]);
