"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "./admin.module.css";

type PricingMode = "AREA" | "FIXED";
type Status =
  | "PENDING"
  | "CONTACTED"
  | "APPROVED"
  | "IN_PRODUCTION"
  | "READY"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";
type Option = { id: string; name: string; price: number; active: boolean };
type Preset = {
  id: string;
  name: string;
  width: number;
  height: number;
  fixedPrice: number | null;
  stock: number | null;
  active: boolean;
  image: string | null;
  description: string;
};
type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  active: boolean;
  pricingMode: PricingMode;
  pricePerM2: number;
  fixedPrice: number;
  minimumPrice: number;
  allowCustomDimensions: boolean;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  dimensionStep: number;
  stock: number | null;
  image: string | null;
  presets: Preset[];
  options: Option[];
};
type DeliveryMethod = {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  requiresAddress: boolean;
};
type Quote = {
  id: string;
  reference: string;
  status: Status;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    company?: string;
    rut?: string;
    comment?: string;
    address?: string;
  };
  snapshot: {
    productName: string;
    presetName: string | null;
    width: number;
    height: number;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    extras: number;
    shipping: number;
    total: number;
    currency: string;
    rules: string[];
  };
  uploadId?: string;
  crop?: { x: number; y: number; zoom: number; rotation: number };
  history: { status: Status; createdAt: string }[];
};

const emptyProduct = (): Product => ({
  id: "",
  name: "",
  slug: "",
  category: "",
  description: "",
  active: true,
  pricingMode: "AREA",
  pricePerM2: 0,
  fixedPrice: 0,
  minimumPrice: 0,
  allowCustomDimensions: true,
  minWidth: 10,
  maxWidth: 300,
  minHeight: 10,
  maxHeight: 300,
  dimensionStep: 1,
  stock: null,
  image: null,
  presets: [],
  options: [],
});
const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
const statusLabels: Record<Status, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  APPROVED: "Aprobado",
  IN_PRODUCTION: "En producción",
  READY: "Listo",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export default function AdminPage() {
  const [session, setSession] = useState<string | null | undefined>(undefined);
  const [tab, setTab] = useState<"products" | "delivery" | "quotes">(
    "products",
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [delivery, setDelivery] = useState<DeliveryMethod[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryMethod | null>(
    null,
  );
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const api = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) setSession(null);
    if (!res.ok)
      throw new Error(body.error || "No se pudo completar la solicitud");
    return body;
  };
  const load = async () => {
    try {
      const data = await api("/api/admin/catalog");
      setProducts(data.products || []);
      setDelivery(data.deliveryMethods || []);
      const q = await api("/api/admin/quotes");
      setQuotes(q.quotes || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el panel");
    }
  };
  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSession(d.email))
      .catch(() => setSession(null));
  }, []);
  useEffect(() => {
    if (session) load();
  }, [session]);

  if (session === undefined)
    return (
      <main className={styles.center}>
        <div className={styles.loader} aria-label="Cargando" />
      </main>
    );
  if (!session) return <Login onSuccess={(email) => setSession(email)} />;

  const saveProduct = async (p: Product) => {
    setBusy(true);
    setError("");
    try {
      const isNew = !p.id;
      const body = isNew ? { ...p, id: crypto.randomUUID() } : p;
      const result = await api(
        isNew ? "/api/admin/products" : `/api/admin/products/${p.id}`,
        { method: isNew ? "POST" : "PUT", body: JSON.stringify(body) },
      );
      const saved = result.product || result;
      setProducts((xs) =>
        isNew ? [...xs, saved] : xs.map((x) => (x.id === p.id ? saved : x)),
      );
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };
  const saveDelivery = async (d: DeliveryMethod) => {
    setBusy(true);
    setError("");
    try {
      const isNew = !d.id;
      const body = isNew ? { ...d, id: crypto.randomUUID() } : d;
      const result = await api(
        isNew
          ? "/api/admin/delivery-methods"
          : `/api/admin/delivery-methods/${d.id}`,
        { method: isNew ? "POST" : "PUT", body: JSON.stringify(body) },
      );
      const saved = result.deliveryMethod || result;
      setDelivery((xs) =>
        isNew ? [...xs, saved] : xs.map((x) => (x.id === d.id ? saved : x)),
      );
      setEditingDelivery(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  };
  const changeStatus = async (status: Status) => {
    if (!selectedQuote) return;
    try {
      await api(`/api/admin/quotes/${selectedQuote.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const q = {
        ...selectedQuote,
        status,
        history: [
          ...selectedQuote.history,
          { status, createdAt: new Date().toISOString() },
        ],
      };
      setSelectedQuote(q);
      setQuotes((xs) => xs.map((x) => (x.id === q.id ? q : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  };
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.mark}>M</span>
          <div>
            <strong>MEGACOLOURS</strong>
            <small>Panel de administración</small>
          </div>
        </div>
        <div className={styles.account}>
          <span>{session}</span>
          <button
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              setSession(null);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.kicker}>Operaciones</div>
          <nav>
            {(
              [
                ["products", "Productos", products.length],
                ["delivery", "Métodos de entrega", delivery.length],
                ["quotes", "Cotizaciones", quotes.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                className={tab === key ? styles.navActive : ""}
                onClick={() => setTab(key)}
                key={key}
              >
                <span>{label}</span>
                <em>{count}</em>
              </button>
            ))}
          </nav>
          <div className={styles.sideNote}>
            <span className={styles.dot} /> Sesión segura activa
          </div>
        </aside>
        <section className={styles.content}>
          {error && (
            <div className={styles.error} role="alert">
              {error}
              <button onClick={() => setError("")}>×</button>
            </div>
          )}
          {tab === "products" && (
            <Products
              items={products}
              onEdit={setEditing}
              onNew={() => setEditing(emptyProduct())}
            />
          )}
          {tab === "delivery" && (
            <Delivery
              items={delivery}
              onEdit={setEditingDelivery}
              onNew={() =>
                setEditingDelivery({
                  id: "",
                  name: "",
                  description: "",
                  price: 0,
                  active: true,
                  requiresAddress: false,
                })
              }
            />
          )}
          {tab === "quotes" && (
            <Quotes items={quotes} onSelect={setSelectedQuote} />
          )}
        </section>
      </div>
      {editing && (
        <ProductEditor
          product={editing}
          busy={busy}
          error={error}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
        />
      )}
      {editingDelivery && (
        <DeliveryEditor
          value={editingDelivery}
          busy={busy}
          error={error}
          onClose={() => setEditingDelivery(null)}
          onSave={saveDelivery}
        />
      )}
      {selectedQuote && (
        <QuoteDetail
          quote={selectedQuote}
          error={error}
          onClose={() => setSelectedQuote(null)}
          onStatus={changeStatus}
        />
      )}
    </main>
  );
}

function Login({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Credenciales inválidas");
      onSuccess(email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className={styles.login}>
      <div className={styles.loginArt}>
        <span className={styles.registration}>C</span>
        <span className={styles.registration + " " + styles.magenta}>M</span>
        <span className={styles.registration + " " + styles.yellow}>Y</span>
        <span className={styles.registration + " " + styles.black}>K</span>
        <p>
          Color que
          <br />
          <i>se mueve.</i>
        </p>
      </div>
      <form className={styles.loginCard} onSubmit={submit}>
        <div className={styles.logoLine}>
          <span className={styles.mark}>M</span>
          <strong>MEGACOLOURS</strong>
        </div>
        <p className={styles.eyebrow}>Área privada</p>
        <h1>Hola, equipo.</h1>
        <p className={styles.muted}>
          Ingresa para gestionar productos, entregas y cotizaciones.
        </p>
        <label>
          Correo electrónico
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className={styles.formError}>{error}</p>}
        <button className={styles.primary} disabled={busy}>
          {busy ? "Ingresando…" : "Entrar al panel"} <span>→</span>
        </button>
      </form>
    </main>
  );
}

function Products({
  items,
  onEdit,
  onNew,
}: {
  items: Product[];
  onEdit: (p: Product) => void;
  onNew: () => void;
}) {
  return (
    <>
      <Toolbar
        title="Productos"
        description="Administra el catálogo y sus reglas de precio."
        action="Nuevo producto"
        onAction={onNew}
      />
      <div className={styles.grid}>
        {items.map((p) => (
          <article className={styles.productCard} key={p.id}>
            <div className={styles.productImage}>
              {p.image ? (
                <img src={p.image} alt="" />
              ) : (
                <span>{p.name.slice(0, 1) || "M"}</span>
              )}
              <b className={p.active ? styles.active : styles.inactive}>
                {p.active ? "Activo" : "Inactivo"}
              </b>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardMeta}>
                {p.category || "Sin categoría"}{" "}
                <span>
                  {p.pricingMode === "AREA" ? "Por área" : "Precio fijo"}
                </span>
              </div>
              <h2>{p.name || "Producto sin nombre"}</h2>
              <p>{p.description || "Sin descripción"}</p>
              <div className={styles.cardFoot}>
                <strong>
                  {p.pricingMode === "AREA"
                    ? `${money(p.pricePerM2)} / m²`
                    : money(p.fixedPrice)}
                </strong>
                <button onClick={() => onEdit(p)}>
                  Editar <span>↗</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <Empty
          title="Aún no hay productos"
          body="Crea el primer producto para comenzar."
        />
      )}
    </>
  );
}
function Delivery({
  items,
  onEdit,
  onNew,
}: {
  items: DeliveryMethod[];
  onEdit: (d: DeliveryMethod) => void;
  onNew: () => void;
}) {
  return (
    <>
      <Toolbar
        title="Métodos de entrega"
        description="Define cómo y dónde reciben los pedidos."
        action="Nueva entrega"
        onAction={onNew}
      />
      <div className={styles.list}>
        {items.map((d) => (
          <article className={styles.deliveryRow} key={d.id}>
            <div className={styles.deliveryIcon}>↗</div>
            <div>
              <h2>{d.name}</h2>
              <p>
                {d.description || "Sin descripción"}
                {d.requiresAddress && " · Requiere dirección"}
              </p>
            </div>
            <strong>{d.price ? money(d.price) : "Gratis"}</strong>
            <b className={d.active ? styles.active : styles.inactive}>
              {d.active ? "Activo" : "Inactivo"}
            </b>
            <button onClick={() => onEdit(d)}>Editar</button>
          </article>
        ))}
      </div>
      {!items.length && (
        <Empty
          title="Sin métodos de entrega"
          body="Agrega una opción para que tus clientes puedan recibir sus productos."
        />
      )}
    </>
  );
}
function Quotes({
  items,
  onSelect,
}: {
  items: Quote[];
  onSelect: (q: Quote) => void;
}) {
  const pending = items.filter((q) => q.status === "PENDING").length;
  return (
    <>
      <Toolbar
        title="Cotizaciones"
        description="Revisa solicitudes y acompaña cada pedido."
      />
      <div className={styles.stats}>
        <div>
          <small>Total recibidas</small>
          <strong>{items.length}</strong>
        </div>
        <div className={styles.statAccent}>
          <small>Requieren atención</small>
          <strong>{pending}</strong>
        </div>
        <div>
          <small>Valor cotizado</small>
          <strong>
            {money(items.reduce((sum, q) => sum + q.snapshot.total, 0))}
          </strong>
        </div>
      </div>
      <div className={styles.quoteTable}>
        <div className={styles.tableHead}>
          <span>Referencia</span>
          <span>Cliente</span>
          <span>Producto</span>
          <span>Total</span>
          <span>Estado</span>
          <span />
        </div>
        {items.map((q) => (
          <button
            className={styles.quoteRow}
            key={q.id}
            onClick={() => onSelect(q)}
          >
            <span>
              <strong>{q.reference}</strong>
              <small>{new Date(q.createdAt).toLocaleDateString("es-CL")}</small>
            </span>
            <span>
              {q.customer.name}
              <small>{q.customer.email}</small>
            </span>
            <span>
              {q.snapshot.productName}
              <small>
                {q.snapshot.width} × {q.snapshot.height} cm ·{" "}
                {q.snapshot.quantity} un.
              </small>
            </span>
            <strong>{money(q.snapshot.total)}</strong>
            <b className={styles["status_" + q.status]}>
              {statusLabels[q.status]}
            </b>
            <span className={styles.arrow}>→</span>
          </button>
        ))}
      </div>
      {!items.length && (
        <Empty
          title="No hay cotizaciones"
          body="Las nuevas solicitudes aparecerán aquí."
        />
      )}
    </>
  );
}
function Toolbar({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.toolbar}>
      <div>
        <p className={styles.eyebrow}>MegaColours / Admin</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && (
        <button className={styles.primary} onClick={onAction}>
          {action} <span>＋</span>
        </button>
      )}
    </div>
  );
}
function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.empty}>
      <span>✦</span>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function useDialogFocus(onClose: () => void) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    if (!node) return;
    const focusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]",
        ),
      );
    (focusable()[0] || node).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusable();
      if (!list.length) return;
      const first = list[0],
        last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose]);
  return ref;
}

function ProductEditor({
  product: initial,
  onClose,
  onSave,
  busy,
  error,
}: {
  product: Product;
  onClose: () => void;
  onSave: (p: Product) => void;
  busy: boolean;
  error: string;
}) {
  const [p, setP] = useState(initial);
  const dialogRef = useDialogFocus(onClose);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const set = (key: keyof Product, value: unknown) =>
    setP((x) => ({ ...x, [key]: value }));
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/uploads", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      set("image", d.url);
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "No se pudo subir la imagen",
      );
    } finally {
      setUploading(false);
    }
  };
  const uploadPreset = async (index: number, file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      if (
        file.size > 15 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new Error("Usa una imagen JPEG, PNG o WebP de máximo 15 MB.");
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/uploads", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo subir la imagen");
      updatePreset(index, { image: d.url });
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "No se pudo subir la imagen",
      );
    } finally {
      setUploading(false);
    }
  };
  const addOption = () =>
    set("options", [
      ...p.options,
      { id: crypto.randomUUID(), name: "", price: 0, active: true },
    ]);
  const addPreset = () =>
    set("presets", [
      ...p.presets,
      {
        id: crypto.randomUUID(),
        name: "",
        width: 0,
        height: 0,
        fixedPrice: null,
        stock: null,
        active: true,
        image: null,
        description: "",
      },
    ]);
  const updatePreset = (i: number, value: Partial<Preset>) =>
    set(
      "presets",
      p.presets.map((a, n) => (n === i ? { ...a, ...value } : a)),
    );
  return (
    <div className={styles.overlay}>
      <section
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className={styles.drawerHead}>
          <div>
            <p className={styles.eyebrow}>Editor de producto</p>
            <h2 id="product-editor-title">{p.name || "Nuevo producto"}</h2>
          </div>
          <button
            className={styles.close}
            aria-label="Cerrar editor"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(p);
          }}
          className={styles.form}
        >
          <fieldset>
            <legend>Información</legend>
            <div className={styles.two}>
              <label>
                Nombre
                <input
                  value={p.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </label>
              <label>
                Slug
                <input
                  value={p.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  required
                />
              </label>
            </div>
            <div className={styles.two}>
              <label>
                Categoría
                <input
                  value={p.category}
                  onChange={(e) => set("category", e.target.value)}
                />
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={p.active}
                  onChange={(e) => set("active", e.target.checked)}
                />{" "}
                Producto activo
              </label>
            </div>
            <label>
              Descripción
              <textarea
                value={p.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Imagen</legend>
            <div className={styles.upload}>
              {p.image ? (
                <img src={p.image} alt="Vista previa" />
              ) : (
                <span>Sin imagen</span>
              )}
              <label className={styles.uploadButton}>
                {uploading ? "Subiendo…" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
            </div>
            {uploadError && <p className={styles.formError}>{uploadError}</p>}
          </fieldset>
          <fieldset>
            <legend>Precio y dimensiones</legend>
            <div className={styles.segment}>
              <button
                type="button"
                className={p.pricingMode === "AREA" ? styles.selected : ""}
                onClick={() => set("pricingMode", "AREA")}
              >
                Por área
              </button>
              <button
                type="button"
                className={p.pricingMode === "FIXED" ? styles.selected : ""}
                onClick={() => set("pricingMode", "FIXED")}
              >
                Precio fijo
              </button>
            </div>
            <div className={styles.three}>
              {p.pricingMode === "AREA" ? (
                <label>
                  Precio por m²
                  <input
                    type="number"
                    min="0"
                    value={p.pricePerM2}
                    onChange={(e) => set("pricePerM2", Number(e.target.value))}
                  />
                </label>
              ) : (
                <label>
                  Precio fijo
                  <input
                    type="number"
                    min="0"
                    value={p.fixedPrice}
                    onChange={(e) => set("fixedPrice", Number(e.target.value))}
                  />
                </label>
              )}
              <label>
                Mínimo
                <input
                  type="number"
                  min="0"
                  value={p.minimumPrice}
                  onChange={(e) => set("minimumPrice", Number(e.target.value))}
                />
              </label>
              <label>
                Stock
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={p.stock ?? ""}
                  onChange={(e) =>
                    set(
                      "stock",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              </label>
            </div>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={p.allowCustomDimensions}
                onChange={(e) => set("allowCustomDimensions", e.target.checked)}
              />{" "}
              Permitir dimensiones personalizadas
            </label>
            <div className={styles.four}>
              {(
                ["minWidth", "maxWidth", "minHeight", "maxHeight"] as const
              ).map((k) => (
                <label key={k}>
                  {k === "minWidth"
                    ? "Ancho mínimo"
                    : k === "maxWidth"
                      ? "Ancho máximo"
                      : k === "minHeight"
                        ? "Alto mínimo"
                        : "Alto máximo"}
                  <input
                    type="number"
                    min="0"
                    value={p[k]}
                    onChange={(e) => set(k, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
            <label>
              Ancho de paso
              <input
                type="number"
                min="1"
                value={p.dimensionStep}
                onChange={(e) => set("dimensionStep", Number(e.target.value))}
              />
            </label>
          </fieldset>
          <fieldset>
            <legend>Preajustes y opciones</legend>
            <div className={styles.subhead}>
              <span>Preajustes</span>
              <button type="button" onClick={addPreset}>
                ＋ Agregar
              </button>
            </div>
            {p.presets.map((x, i) => (
              <div className={styles.preset} key={x.id}>
                <div className={styles.inline}>
                  <input
                    aria-label="Nombre del preajuste"
                    placeholder="Nombre"
                    value={x.name}
                    onChange={(e) => updatePreset(i, { name: e.target.value })}
                  />
                  <input
                    aria-label="Precio del preajuste"
                    type="number"
                    placeholder="Precio"
                    value={x.fixedPrice ?? ""}
                    onChange={(e) =>
                      updatePreset(i, {
                        fixedPrice:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label="Eliminar preajuste"
                    onClick={() =>
                      set(
                        "presets",
                        p.presets.filter((_, n) => n !== i),
                      )
                    }
                  >
                    ×
                  </button>
                </div>
                <div className={styles.four}>
                  {(["width", "height", "stock"] as const).map((k) => (
                    <label key={k}>
                      {k === "width"
                        ? "Ancho"
                        : k === "height"
                          ? "Alto"
                          : "Stock"}
                      <input
                        type="number"
                        min="0"
                        value={x[k] ?? ""}
                        onChange={(e) =>
                          updatePreset(i, {
                            [k]:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          } as Partial<Preset>)
                        }
                      />
                    </label>
                  ))}
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={x.active}
                      onChange={(e) =>
                        updatePreset(i, { active: e.target.checked })
                      }
                    />{" "}
                    Activo
                  </label>
                </div>
                <label>
                  Descripción
                  <textarea
                    rows={2}
                    value={x.description}
                    onChange={(e) =>
                      updatePreset(i, { description: e.target.value })
                    }
                  />
                </label>
                <div className={styles.upload}>
                  {x.image && (
                    <img src={x.image} alt="Vista previa del preajuste" />
                  )}
                  <label className={styles.uploadButton}>
                    Subir imagen
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => uploadPreset(i, e.target.files?.[0])}
                    />
                  </label>
                  {x.image && (
                    <button
                      type="button"
                      onClick={() => updatePreset(i, { image: null })}
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className={styles.subhead}>
              <span>Opciones extra</span>
              <button type="button" onClick={addOption}>
                ＋ Agregar
              </button>
            </div>
            {p.options.map((x, i) => (
              <div className={styles.inline} key={x.id}>
                <input
                  aria-label="Nombre de opción"
                  placeholder="Nombre"
                  value={x.name}
                  onChange={(e) =>
                    set(
                      "options",
                      p.options.map((a, n) =>
                        n === i ? { ...a, name: e.target.value } : a,
                      ),
                    )
                  }
                />
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={x.active}
                    onChange={(e) =>
                      set(
                        "options",
                        p.options.map((a, n) =>
                          n === i ? { ...a, active: e.target.checked } : a,
                        ),
                      )
                    }
                  />{" "}
                  Activa
                </label>
                <input
                  aria-label="Precio de opción"
                  type="number"
                  placeholder="Precio"
                  value={x.price}
                  onChange={(e) =>
                    set(
                      "options",
                      p.options.map((a, n) =>
                        n === i ? { ...a, price: Number(e.target.value) } : a,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  aria-label="Eliminar opción"
                  onClick={() =>
                    set(
                      "options",
                      p.options.filter((_, n) => n !== i),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </fieldset>
          <div className={styles.drawerActions}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className={styles.primary} disabled={busy || uploading}>
              {busy ? "Guardando…" : "Guardar producto"} <span>→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeliveryEditor({
  value: initial,
  onClose,
  onSave,
  busy,
  error,
}: {
  value: DeliveryMethod;
  onClose: () => void;
  onSave: (d: DeliveryMethod) => void;
  busy: boolean;
  error: string;
}) {
  const [d, setD] = useState(initial);
  const dialogRef = useDialogFocus(onClose);
  return (
    <div className={styles.overlay}>
      <section
        ref={dialogRef}
        tabIndex={-1}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-editor-title"
      >
        <div className={styles.drawerHead}>
          <div>
            <p className={styles.eyebrow}>Editor de entrega</p>
            <h2 id="delivery-editor-title">{d.name || "Nueva entrega"}</h2>
          </div>
          <button className={styles.close} onClick={onClose}>
            ×
          </button>
        </div>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            onSave(d);
          }}
        >
          <label>
            Nombre
            <input
              required
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
            />
          </label>
          <label>
            Descripción
            <textarea
              rows={3}
              value={d.description}
              onChange={(e) => setD({ ...d, description: e.target.value })}
            />
          </label>
          <label>
            Precio
            <input
              type="number"
              min="0"
              value={d.price}
              onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
            />
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={d.requiresAddress}
              onChange={(e) =>
                setD({ ...d, requiresAddress: e.target.checked })
              }
            />{" "}
            Requiere dirección
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={d.active}
              onChange={(e) => setD({ ...d, active: e.target.checked })}
            />{" "}
            Método activo
          </label>
          <div className={styles.drawerActions}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className={styles.primary} disabled={busy}>
              {busy ? "Guardando…" : "Guardar método"} <span>→</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function QuoteDetail({
  quote: q,
  onClose,
  onStatus,
  error,
}: {
  quote: Quote;
  onClose: () => void;
  onStatus: (s: Status) => void;
  error: string;
}) {
  const dialogRef = useDialogFocus(onClose);
  return (
    <div className={styles.overlay}>
      <section
        className={styles.dialog + " " + styles.quoteDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-detail-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className={styles.drawerHead}>
          <div>
            <p className={styles.eyebrow}>{q.reference}</p>
            <h2 id="quote-detail-title">{q.customer.name}</h2>
          </div>
          <button
            className={styles.close}
            aria-label="Cerrar detalle"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className={styles.detail}>
          <div className={styles.detailStatus}>
            <span>Estado actual</span>
            <select
              aria-label="Estado de la cotización"
              value={q.status}
              onChange={(e) => onStatus(e.target.value as Status)}
            >
              {Object.keys(statusLabels).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s as Status]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.detailGrid}>
            <div>
              <small>Producto</small>
              <strong>{q.snapshot.productName}</strong>
              <span>
                {q.snapshot.presetName || "Medida personalizada"} ·{" "}
                {q.snapshot.width} × {q.snapshot.height} cm
              </span>
            </div>
            <div>
              <small>Total</small>
              <strong className={styles.total}>
                {money(q.snapshot.total)}
              </strong>
              <span>
                {q.snapshot.quantity} unidades · {q.snapshot.currency}
              </span>
            </div>
          </div>
          <div className={styles.breakdown}>
            <div>
              <span>Precio unitario</span>
              <strong>{money(q.snapshot.unitPrice)}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{money(q.snapshot.subtotal)}</strong>
            </div>
            <div>
              <span>Extras</span>
              <strong>{money(q.snapshot.extras)}</strong>
            </div>
            <div>
              <span>Envío</span>
              <strong>{money(q.snapshot.shipping)}</strong>
            </div>
          </div>
          {q.snapshot.rules.length > 0 && (
            <div className={styles.rules}>
              <small>Reglas aplicadas</small>
              {q.snapshot.rules.map((rule) => (
                <span key={rule}>✓ {rule}</span>
              ))}
            </div>
          )}
          <div className={styles.customer}>
            <h3>Datos de contacto</h3>
            <p>
              {q.customer.email} · {q.customer.phone}
            </p>
            {q.customer.company && <p>{q.customer.company}</p>}
            {q.customer.rut && <p>RUT {q.customer.rut}</p>}
            {q.customer.address && <p>{q.customer.address}</p>}
            {q.customer.comment && (
              <blockquote>“{q.customer.comment}”</blockquote>
            )}
          </div>
          {q.uploadId && (
            <div className={styles.uploadInfo}>
              <div
                className={styles.cropFrame}
                style={{
                  aspectRatio: `${q.snapshot.width} / ${q.snapshot.height}`,
                }}
              >
                <img
                  className={styles.cropPreview}
                  src={`/api/uploads/${q.uploadId}`}
                  alt="Vista previa del archivo"
                  style={
                    q.crop
                      ? {
                          objectPosition: `${q.crop.x * 100}% ${q.crop.y * 100}%`,
                          transform: `scale(${q.crop.zoom})`,
                        }
                      : undefined
                  }
                />
              </div>
              <span className={styles.fileIcon}>▧</span>
              <div>
                <strong>Archivo original adjunto</strong>
                <small>ID: {q.uploadId}</small>
                {q.crop && (
                  <small>
                    Recorte: foco {Math.round(q.crop.x * 100)}%,{" "}
                    {Math.round(q.crop.y * 100)}% · zoom {q.crop.zoom} · giro{" "}
                    {q.crop.rotation}°
                  </small>
                )}
              </div>
              <a
                href={`/api/uploads/${q.uploadId}`}
                target="_blank"
                rel="noreferrer"
              >
                Descargar ↗
              </a>
            </div>
          )}
          <div className={styles.history}>
            <h3>Historial</h3>
            {q.history.map((h, i) => (
              <div key={i}>
                <span className={styles.timelineDot} />
                <div>
                  <strong>{statusLabels[h.status]}</strong>
                  <small>{new Date(h.createdAt).toLocaleString("es-CL")}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
