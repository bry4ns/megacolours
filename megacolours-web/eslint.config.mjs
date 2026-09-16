import {defineConfig} from 'eslint/config'
export default defineConfig([{ignores:['.next/**','node_modules/**','e2e/**','playwright-report/**','test-results/**','**/*.ts','**/*.tsx','**/*.d.ts']},{files:['**/*.{js,mjs}'],rules:{'no-console':'warn'}}])
