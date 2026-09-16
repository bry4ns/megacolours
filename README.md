# MegaColours

Plataforma de imprenta con dos repositorios Git independientes:

- `megacolours-web`: landing comercial, cotizador y administración en Next.js.
- `megacolours-api`: catálogo, imágenes originales, precios, cotizaciones y autenticación en Fastify y SQLite.

Esta carpeta es un punto de coordinación local, no un monorepo. Cada repositorio tiene sus propias dependencias, historial y comandos. `sources/` contiene referencias de solo lectura.

## Puesta en marcha

Requisito: Node.js 24 y npm.

1. En `megacolours-api`, instalar dependencias con `npm install` y copiar `.env.example` a `.env`. Configurar `ADMIN_EMAIL`, una contraseña propia en `ADMIN_PASSWORD` y un valor aleatorio para `SESSION_SECRET`.
2. Iniciar el backend con `npm run dev`.
3. En otra terminal, dentro de `megacolours-web`, instalar dependencias con `npm install` y copiar `.env.example` a `.env.local`.
4. Iniciar el frontend con `npm run dev`.
5. Abrir `http://localhost:3000`. Cotizador: `/cotizar`. Administración: `/admin`.

Consultar los README de cada repositorio para las variables y comandos exactos.

En este entorno local ya se generaron `.env` y `.env.local`. La cuenta administrativa local y su contraseña aleatoria se encuentran en `megacolours-api/.env`; este archivo no se debe compartir ni subir al repositorio.

## Verificación de integración

Desde `megacolours-web`, ejecutar `npx playwright install chromium` una vez y después `npx playwright test`. Las pruebas levantan ambos servicios en los puertos 3100 y 4100 con una base de datos temporal. Requieren las dependencias instaladas en ambos repositorios. Comprueban cotización móvil, acceso y creación de productos en administración, archivos originales, validación de precios y conservación de cotizaciones.

## Decisiones iniciales

- TypeScript en ambos proyectos para facilitar el mantenimiento.
- API independiente; el frontend comunica solicitudes mediante `/api` al backend.
- SQLite persistente para una primera instalación local de una sola instancia. Una migración a una base de datos administrada puede hacerse en una fase de despliegue.
- CLP enteros. El backend calcula precios, valida dimensiones, cantidades y disponibilidad y guarda una copia de las reglas y valores aplicados.
- Las imágenes originales se conservan junto con los datos de encuadre; la vista del cotizador es aproximada y no constituye un archivo final de imprenta.
- Crear una cotización no efectúa un pago ni confirma automáticamente producción o entrega.
- La administración requiere una sesión validada en el backend.
- El catálogo inicial es demostrativo. Los precios, disponibilidad y métodos de entrega se deben revisar antes de uso comercial.

## Información comercial pendiente

Antes de publicar se requieren el logotipo definitivo, fotografías autorizadas de trabajos, datos de contacto, precios y condiciones reales, reglas de despacho, políticas de privacidad y los datos del alojamiento. No se inventan testimonios ni trabajos de clientes.

## Fases posteriores

Tras validar esta base con el negocio: precios por tramos, documentos de cotización, notificaciones, reserva de stock y pagos cuando se definan sus reglas, preflight de archivos para imprenta y despliegue con copias de seguridad. No forman parte de los requisitos obligatorios de esta base.

El contrato técnico compartido se encuentra en `IMPLEMENTATION.md`.
