import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    '.next/**',
    'build/**',
    'docs/**',
    'jest.config.ts',
    'jest.setup.ts',
    'mobile/**',
    'next-env.d.ts',
    'node_modules/**',
    'out/**',
    'public/workers/**',
    'src-tauri/**',
    'src-tauri/target/**',
    'src/generated/**',
  ]),
]);
