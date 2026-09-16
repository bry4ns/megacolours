# MegaColours — initial implementation contract

Two independent Git repositories: megacolours-web (Next App Router, TypeScript, Tailwind, Motion, Zod, React Hook Form) and megacolours-api (Fastify, TypeScript, node:sqlite on Node 24). Never modify sources/. Spanish Chile UI. CLP integer money; dimensions integer centimetres; prices computed using integer arithmetic with explicit rounding up. Seed products are demo data, not commercial promises.

## HTTP contract
API port 4000; web port 3000. Web calls `/api/...`; Next rewrites this to `http://127.0.0.1:4000/api/...` (API_ORIGIN env override). All JSON errors `{error: string}`. Catalog GET `/api/catalog` returns `{products: Product[], deliveryMethods: DeliveryMethod[]}`.

Product: `{id, name, slug, category, description, active, pricingMode: 'AREA'|'FIXED', pricePerM2: number, fixedPrice: number, minimumPrice: number, allowCustomDimensions: boolean, minWidth: number, maxWidth: number, minHeight: number, maxHeight: number, dimensionStep: number, stock: number|null, image: string|null, presets: Preset[], options: ProductOption[]}`.
Preset: `{id,name,width,height,fixedPrice:number|null,stock:number|null,active:boolean,image:string|null,description:string}`.
ProductOption: `{id,name,price:number,active:boolean}` (price per item).
DeliveryMethod: `{id,name,description,price:number,active:boolean,requiresAddress:boolean}`.

Selection: `{productId,presetId?:string,width:number,height:number,quantity:number,options:string[],deliveryMethodId:string}`. POST `/api/quotes/estimate` takes Selection and returns PriceSnapshot.
PriceSnapshot: `{productName,presetName:string|null,width,height,quantity,unitPrice,subtotal,extras,shipping,total,currency:'CLP',rules:string[]}`. Price rules: preset fixed price overrides; otherwise AREA ceiling(width*height*pricePerM2/10000) with per-unit minimum or FIXED fixedPrice, plus selected option price per quantity; delivery price once. Check all dimensions, stock, active values, safe integer amounts. Reject unknown inputs including finalPrice.

POST `/api/uploads` multipart field `file` (JPEG/PNG/WebP, max 15 MB), returns `{id,url,originalName,width,height}`. Preserve original bytes; validate file signature and dimensions. GET `/api/uploads/:id` serves original. No public upload directory listing.
Crop `{x:number,y:number,zoom:number,rotation:0}`: x/y normalized 0..1 focal point, zoom 1..5. Store original upload ID and crop metadata; UI preview uses object-fit cover and object-position with scale (approximate preview).
POST `/api/quotes` takes `{selection:Selection,customer:{name,phone,email,company?:string,rut?:string,comment?:string,address?:string},uploadId?:string,crop?:Crop}`; requires upload/crop together when present, returns `{id,reference,status:'PENDING',snapshot:PriceSnapshot}`. Address required by delivery method. Transactional yearly sequential reference MC-YYYY-000001. Immutable quote snapshot and status history.

Admin auth: POST `/api/admin/login` `{email,password}` sets HttpOnly SameSite=Lax session cookie; POST `/api/admin/logout`; GET `/api/admin/session` returns `{email}` or 401. Credentials configured through env ADMIN_EMAIL, ADMIN_PASSWORD (no hardcoded credentials). All admin routes authorized on server. GET `/api/admin/catalog` returns all products/deliveryMethods; PUT `/api/admin/products/:id` full Product; POST `/api/admin/products` full Product; PUT `/api/admin/delivery-methods/:id` full DeliveryMethod; POST `/api/admin/delivery-methods` full DeliveryMethod. GET `/api/admin/quotes` returns `{quotes:[{id,reference,status,createdAt,customer,snapshot,uploadId,crop,history:[{status,createdAt}]}]}`; PATCH `/api/admin/quotes/:id/status` `{status}`. Status PENDING, CONTACTED, APPROVED, IN_PRODUCTION, READY, SHIPPED, COMPLETED, CANCELLED. Admin image fields accept upload URLs only or null. Categories initially product category strings managed by product edit.

## Design direction
White paper #FAFAF7, ink blue #18244A, cyan #00A9D6, magenta #EF3785, press yellow #FFE04B, muted ink #667089. Oversized condensed display type with a clean body face. Signature: overlapping printed sample sheets with offset CMYK registration marks in hero; readable and restrained elsewhere. Spanish content, no fabricated testimonials, client logos, finished jobs, contact details or business metrics. Gallery explicitly labelled sample applications. Responsive, keyboard accessible, reduced motion.

## Ownership
Backend agent owns megacolours-api only. Frontend agent owns megacolours-web public landing, quote flow, shared UI, config, API types and styles. Admin agent owns only megacolours-web/app/admin/** and admin-specific components/styles; coordinate shared types with frontend agent. Root owns integration, verification, documentation and necessary cross-cutting fixes.
