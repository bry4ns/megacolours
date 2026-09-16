# MegaColours web

Frontend público de MegaColours con Next App Router. Ejecuta `npm run dev` para iniciar en el puerto 3000. El catálogo y las cotizaciones se consultan en `/api`; configura `API_ORIGIN` para apuntar al backend local.

Para ejecutar el flujo de navegador: instala dependencias y Chromium (`npm install` en web y API, `npx playwright install chromium`), luego ejecuta `npm run test:e2e`. Las pruebas esperan la API hermana en `../megacolours-api`.
