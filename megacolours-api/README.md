# API de MegaColours

API Fastify + TypeScript para catálogo, cotizaciones CLP, cargas de imágenes y administración autenticada. Requiere Node 24+ (`node:sqlite`).

Copie `.env.example` a `.env` y configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `SESSION_SECRET`; el servidor rechaza credenciales faltantes. `HOST`, `PORT` y `WEB_ORIGIN` son configurables. Ejecute `npm install`, `npm run build` y `npm start`.

La base SQLite y los archivos originales viven bajo `data/`. Las cargas se sirven solo por su ID opaco; nunca se transforma ni se lista el original. Las imágenes aceptan JPEG, PNG y WebP hasta 15 MB y 100 MP. El precio por área usa redondeo entero hacia arriba; el stock solo se valida al cotizar.
