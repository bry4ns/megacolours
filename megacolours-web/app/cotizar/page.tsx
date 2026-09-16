'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, clp, Crop, DeliveryMethod, PriceSnapshot, Product, Selection } from '../../lib/api'
import { Product3DViewer } from '../components/Product3DViewer'
import { ImageCropper, CropState } from '../components/ImageCropper'

const schema = z.object({
  name: z.string().min(2, 'Escribe tu nombre'),
  phone: z.string().min(6, 'Ingresa un teléfono válido'),
  email: z.string().email('Revisa tu email'),
  company: z.string().optional(),
  rut: z.string().optional(),
  comment: z.string().optional(),
  address: z.string().optional(),
})
type Customer = z.infer<typeof schema>
const fallbackProducts: Product[] = []

export default function Quote() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [deliveries, setDeliveries] = useState<DeliveryMethod[]>([])
  const [productId, setProductId] = useState('')
  const [presetId, setPresetId] = useState('')
  const [width, setWidth] = useState(80)
  const [height, setHeight] = useState(180)
  const [quantity, setQuantity] = useState(1)
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [deliveryId, setDeliveryId] = useState('')
  const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null)
  const [estimateState, setEstimateState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [upload, setUpload] = useState<{
    id: string
    url: string
    originalName: string
    width: number
    height: number
  } | null>(null)
  const [crop, setCrop] = useState<CropState>({ x: 0.5, y: 0.5, zoom: 1, rotation: 0 })
  const [effectivePx, setEffectivePx] = useState<{ width: number; height: number } | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [lockAspectRatio, setLockAspectRatio] = useState(true)
  const [sizeMode, setSizeMode] = useState<'presets' | 'custom'>('presets')
  const [show3DPreview, setShow3DPreview] = useState(true)
  const [sent, setSent] = useState<{
    id: string
    reference: string
    status: string
    snapshot: PriceSnapshot
  } | null>(null)

  const request = useRef(0)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Customer>({ resolver: zodResolver(schema) })

  // Initial catalog fetch
  useEffect(() => {
    api<{ products: Product[]; deliveryMethods: DeliveryMethod[] }>('/catalog')
      .then((c) => {
        const ps = c.products.filter((p) => p.active)
        const ds = c.deliveryMethods.filter((d) => d.active)
        setProducts(ps)
        setDeliveries(ds)
        // Default to 'paloma' if available, otherwise first product
        const initialP = ps.find((p) => p.id === 'paloma') || ps[0]
        if (initialP) {
          setProductId(initialP.id)
          const pre = initialP.presets.find((x) => x.active)
          if (pre) {
            setPresetId(pre.id)
            setWidth(pre.width)
            setHeight(pre.height)
          } else {
            setWidth(initialP.minWidth || 80)
            setHeight(initialP.minHeight || 180)
          }
        }
        if (ds[0]) setDeliveryId(ds[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  const product = products.find((p) => p.id === productId)
  const preset = product?.presets.find((p) => p.id === presetId)
  const delivery = deliveries.find((d) => d.id === deliveryId)

  // Estimate pricing on selection change
  useEffect(() => {
    if (!product || !delivery) return
    const current = ++request.current
    setEstimateState('loading')
    setSnapshot(null)
    const selection: Selection = {
      productId,
      presetId: presetId || undefined,
      width,
      height,
      quantity,
      options: optionIds,
      deliveryMethodId: deliveryId,
    }
    api<PriceSnapshot>('/quotes/estimate', {
      method: 'POST',
      body: JSON.stringify(selection),
    })
      .then((s) => {
        if (current === request.current) {
          setSnapshot(s)
          setEstimateState('ready')
        }
      })
      .catch((e) => {
        if (current === request.current) {
          setError(e.message)
          setEstimateState('error')
        }
      })
  }, [productId, presetId, width, height, quantity, optionIds, deliveryId, product, delivery])

  function changeProduct(id: string) {
    const p = products.find((x) => x.id === id)
    setProductId(id)
    const pre = p?.presets.find((x) => x.active)
    setPresetId(pre?.id || '')
    setWidth(pre?.width || p?.minWidth || 80)
    setHeight(pre?.height || p?.minHeight || 180)
    setOptionIds([])
  }

  // Handle uploaded file
  async function handleFile(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      setError('La imagen supera el máximo de 15 MB.')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    setError('')
    setUploading(true)
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo subir la imagen')
      setUpload(data)
      setCrop({ x: 0.5, y: 0.5, zoom: 1, rotation: 0 })
      setEffectivePx({ width: data.width, height: data.height })

      // Auto adjust recommended dimensions based on image aspect ratio if in custom mode
      if (data.width && data.height) {
        const aspect = data.width / data.height
        if (aspect < 0.6) {
          // Tall portrait -> suggest Paloma
          const paloma = products.find((p) => p.id === 'paloma')
          if (paloma) changeProduct('paloma')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  // Handle width change with aspect lock
  function handleWidthChange(newW: number) {
    setWidth(newW)
    setPresetId('')
    if (lockAspectRatio && effectivePx && effectivePx.width && effectivePx.height) {
      const ratio = effectivePx.height / effectivePx.width
      const calculatedH = Math.round(newW * ratio)
      if (product) {
        setHeight(Math.max(product.minHeight, Math.min(product.maxHeight, calculatedH)))
      } else {
        setHeight(calculatedH)
      }
    }
  }

  // Handle height change with aspect lock
  function handleHeightChange(newH: number) {
    setHeight(newH)
    setPresetId('')
    if (lockAspectRatio && effectivePx && effectivePx.width && effectivePx.height) {
      const ratio = effectivePx.width / effectivePx.height
      const calculatedW = Math.round(newH * ratio)
      if (product) {
        setWidth(Math.max(product.minWidth, Math.min(product.maxWidth, calculatedW)))
      } else {
        setWidth(calculatedW)
      }
    }
  }

  // Calculate current DPI and quality level
  const currentDpi =
    effectivePx && width && height
      ? Math.round(Math.min(effectivePx.width / (width / 2.54), effectivePx.height / (height / 2.54)))
      : null

  // Resolution-based size recommendations
  const recommendations = effectivePx
    ? [
        {
          label: 'Calidad Fotográfica (150 DPI)',
          desc: 'Excelente nitidez para ver de cerca.',
          w: Math.round((effectivePx.width / 150) * 2.54),
          h: Math.round((effectivePx.height / 150) * 2.54),
          badge: '🟢 Óptima',
        },
        {
          label: 'Calidad Estándar (100 DPI)',
          desc: 'Buena definición para carteles a 1 metro.',
          w: Math.round((effectivePx.width / 100) * 2.54),
          h: Math.round((effectivePx.height / 100) * 2.54),
          badge: '🟡 Muy buena',
        },
        {
          label: 'Gran Formato (72 DPI)',
          desc: 'Tamaño máximo para ver a más de 2 metros.',
          w: Math.round((effectivePx.width / 72) * 2.54),
          h: Math.round((effectivePx.height / 72) * 2.54),
          badge: '🟠 Impacto',
        },
      ]
    : []

  async function submit(customer: Customer) {
    if (!snapshot || estimateState !== 'ready' || isSubmitting) return
    if (delivery?.requiresAddress && !customer.address) {
      setError('Este método de entrega necesita una dirección.')
      return
    }
    setError('')
    const selection: Selection = {
      productId,
      presetId: presetId || undefined,
      width,
      height,
      quantity,
      options: optionIds,
      deliveryMethodId: deliveryId,
    }
    try {
      const result = await api<typeof sent>('/quotes', {
        method: 'POST',
        body: JSON.stringify({
          selection,
          customer,
          uploadId: upload?.id,
          crop: upload ? crop : undefined,
        }),
      })
      setSent(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cotización')
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-[#18244A] px-5 py-12 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="MegaColours Logo" className="h-10 w-10 rounded-full object-cover border border-white/30" />
            <Link href="/" className="display text-2xl font-bold tracking-tight">
              Mega<span className="text-[#EF3785]">Colours</span>.
            </Link>
          </div>
          <div className="mt-20 border border-white/20 p-8 md:p-12 rounded-2xl bg-white/5 backdrop-blur-xs">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#FFE04B]">
              Cotización recibida
            </p>
            <h1 className="display mt-5 text-6xl leading-[.85] md:text-8xl">
              Estamos<br />
              <span className="text-[#00A9D6]">en contacto.</span>
            </h1>
            <p className="mt-8 text-white/70">Tu número de seguimiento es</p>
            <p className="display mt-1 text-4xl text-[#FFE04B] font-mono tracking-wider">
              {sent.reference}
            </p>
            <p className="mt-7 text-white/80">
              Total estimado: <strong className="text-white font-bold">{clp(sent.snapshot.total)}</strong> ({sent.snapshot.productName}, {sent.snapshot.width} × {sent.snapshot.height} cm).
            </p>
            <p className="mt-2 text-sm text-white/60">
              Nuestro equipo validará los archivos antes de confirmar producción.
            </p>
            <Link
              href="/"
              className="focus-ring mt-9 inline-block rounded-full bg-[#EF3785] px-8 py-3.5 font-bold transition hover:bg-[#00A9D6]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#18244A]">
      {/* Header */}
      <header className="border-b border-[#18244a22] bg-white/80 backdrop-blur-xs sticky top-0 z-30 px-5 md:px-10">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="MegaColours Logo" className="h-10 w-10 rounded-full object-cover border border-[#18244A33]" />
            <span className="display text-2xl font-bold">
              Mega<span className="text-[#EF3785]">Colours</span>
              <span className="text-[#00A9D6]">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShow3DPreview(!show3DPreview)}
              className={`hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                show3DPreview
                  ? 'bg-[#18244A] text-white border-[#18244A]'
                  : 'bg-white text-[#18244A] border-[#18244a30]'
              }`}
            >
              <span>{show3DPreview ? '👁 Ocultar 3D' : '📦 Ver Mockup 3D'}</span>
            </button>
            <Link href="/" className="focus-ring text-sm font-bold hover:text-[#EF3785]">
              ← Volver
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 md:px-10 md:py-16 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#EF3785]">
              Cotizador Inteligente
            </p>
            <h1 className="display mt-3 text-5xl leading-[.88] md:text-7xl">
              Dale forma<br />
              a tu idea<span className="text-[#00A9D6]">.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[#667089]">
              Sube tu diseño para recibir sugerencias automáticas de tamaño según su resolución y visualiza tu maqueta virtual en 3D.
            </p>
          </div>

          {error && (
            <div role="alert" className="border-l-4 border-[#EF3785] bg-[#EF378514] p-4 text-sm rounded-r-lg">
              {error}{' '}
              <button className="ml-2 font-bold underline text-[#EF3785]" onClick={() => setError('')}>
                Cerrar
              </button>
            </div>
          )}

          {/* STEP 1: SUBIR IMAGEN */}
          <section className="rounded-2xl border border-[#18244a22] bg-white p-6 md:p-8 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="display text-2xl font-bold">01 / Tu Diseño o Imagen</h2>
              {upload && (
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs px-3 py-1 font-bold">
                  ✓ Imagen cargada
                </span>
              )}
            </div>

            {!upload ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleFile(file)
                }}
                className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition ${
                  dragOver
                    ? 'border-[#00A9D6] bg-[#00A9D60a]'
                    : 'border-[#18244a33] bg-[#FAFAF7] hover:border-[#18244A]'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#18244A10] text-2xl mb-3">
                  🖼
                </div>
                <p className="text-base font-bold text-[#18244A]">
                  Arrastra tu imagen aquí o selecciónala de tu equipo
                </p>
                <p className="mt-1 text-xs text-[#667089]">
                  JPEG, PNG o WebP · Hasta 15 MB
                </p>
                <label className="focus-ring mt-5 inline-block cursor-pointer rounded-full bg-[#18244A] px-6 py-3 font-bold text-white text-sm transition hover:bg-[#EF3785]">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFile(f)
                    }}
                    className="sr-only"
                  />
                  {uploading ? 'Subiendo y analizando…' : 'Seleccionar archivo'}
                </label>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FAFAF7] border border-[#18244a15]">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-lg border border-[#18244A22] bg-cover bg-center shrink-0 shadow-xs"
                      style={{ backgroundImage: `url(${upload.url})` }}
                    />
                    <div>
                      <p className="font-bold text-sm text-[#18244A]">{upload.originalName}</p>
                      <p className="text-xs text-[#667089] mt-0.5 font-mono">
                        Resolución original: {upload.width} × {upload.height} px
                      </p>
                      {effectivePx && (
                        <p className="text-[11px] text-[#00A9D6] font-bold">
                          Área útil de encuadre: {effectivePx.width} × {effectivePx.height} px
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCropper(!showCropper)}
                      className="focus-ring rounded-lg border border-[#18244a30] bg-white px-3.5 py-2 text-xs font-bold text-[#18244A] hover:border-[#EF3785]"
                    >
                      {showCropper ? 'Cerrar encuadre' : '✂ Ajustar encuadre / recorte'}
                    </button>
                    <label className="focus-ring cursor-pointer rounded-lg bg-[#18244A15] px-3.5 py-2 text-xs font-bold text-[#18244A] hover:bg-[#18244A25]">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleFile(f)
                        }}
                        className="sr-only"
                      />
                      Cambiar
                    </label>
                  </div>
                </div>

                {/* Interactive Cropper Panel */}
                {showCropper && (
                  <div className="mt-4">
                    <ImageCropper
                      imageUrl={upload.url}
                      originalWidth={upload.width}
                      originalHeight={upload.height}
                      crop={crop}
                      targetAspectRatio={width && height ? width / height : undefined}
                      onChange={(newCrop, eff) => {
                        setCrop(newCrop)
                        setEffectivePx(eff)
                      }}
                      onClose={() => setShowCropper(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* STEP 2: SOPORTE / PRODUCTO */}
          <section className="rounded-2xl border border-[#18244a22] bg-white p-6 md:p-8 shadow-xs">
            <h2 className="display text-2xl font-bold">02 / Selecciona el Soporte</h2>
            <p className="mt-1 text-xs text-[#667089]">
              Elige el formato físico para la producción de tu pieza gráfica.
            </p>

            {products.length ? (
              <>
                {/* Accessible select for form & tests */}
                <select
                  aria-label="Producto"
                  className="focus-ring mt-4 w-full border-b-2 border-[#18244A] bg-transparent py-3 text-lg font-bold"
                  value={productId}
                  onChange={(e) => changeProduct(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.fixedPrice ? `· ${clp(p.fixedPrice)}` : `· desde ${clp(p.pricePerM2)}/m²`}
                    </option>
                  ))}
                </select>

                {/* Visual Product Grid */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {products.map((p) => {
                    const isSelected = p.id === productId
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => changeProduct(p.id)}
                        className={`text-left p-4 rounded-xl border-2 transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#EF3785] bg-[#EF378508] shadow-xs'
                            : 'border-[#18244a15] hover:border-[#00A9D6] bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-base text-[#18244A]">{p.name}</span>
                            {p.id === 'paloma' && (
                              <span className="text-[10px] uppercase font-bold bg-[#FFE04B] text-[#18244A] px-2 py-0.5 rounded-full">
                                Más popular
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-[#667089] leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-[#18244a10] flex justify-between items-center text-xs">
                          <span className="text-[#667089]">{p.category}</span>
                          <span className="font-bold text-[#18244A]">
                            {p.fixedPrice ? clp(p.fixedPrice) : `${clp(p.pricePerM2)} / m²`}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="border border-[#18244a22] p-5 text-sm text-[#667089]">
                Cargando productos disponibles…
              </p>
            )}
          </section>

          {/* STEP 3: MEDIDAS Y RECOMENDACIONES SEGÚN RESOLUCIÓN */}
          <section className="rounded-2xl border border-[#18244a22] bg-white p-6 md:p-8 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="display text-2xl font-bold">03 / Medidas y Formato</h2>
                <p className="mt-1 text-xs text-[#667089]">
                  Recomendaciones calculadas según los píxeles reales de tu diseño.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#18244A10] p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSizeMode('presets')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    sizeMode === 'presets' ? 'bg-[#18244A] text-white shadow-xs' : 'text-[#18244A]'
                  }`}
                >
                  Medidas Estándar
                </button>
                <button
                  type="button"
                  onClick={() => setSizeMode('custom')}
                  disabled={!product?.allowCustomDimensions}
                  className={`px-3 py-1.5 rounded-md transition ${
                    sizeMode === 'custom' ? 'bg-[#18244A] text-white shadow-xs' : 'text-[#18244A]'
                  } disabled:opacity-40`}
                >
                  Personalizada (cm)
                </button>
              </div>
            </div>

            {/* Smart Recommendations Bar if image uploaded */}
            {upload && recommendations.length > 0 && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-[#00A9D610] to-[#EF378510] border border-[#00A9D630]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">💡</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#18244A]">
                    Recomendaciones automáticas para tu imagen ({effectivePx?.width} × {effectivePx?.height} px):
                  </span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {recommendations.map((rec, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => {
                        setSizeMode('custom')
                        setPresetId('')
                        setWidth(rec.w)
                        setHeight(rec.h)
                      }}
                      className="text-left p-3 rounded-lg bg-white border border-[#18244a15] hover:border-[#00A9D6] transition shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#18244A]">{rec.badge}</span>
                        <span className="text-[11px] font-mono font-bold text-[#00A9D6] group-hover:underline">
                          Elegir →
                        </span>
                      </div>
                      <p className="mt-1 font-mono font-bold text-base text-[#18244A]">
                        {rec.w} × {rec.h} cm
                      </p>
                      <p className="text-[11px] text-[#667089] mt-0.5">{rec.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Presets Mode */}
            {sizeMode === 'presets' && product && (
              <div className="mt-6">
                <p className="text-xs font-bold text-[#667089] mb-3 uppercase tracking-wider">
                  Formatos estándar de {product.name}:
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {product.presets
                    .filter((p) => p.active)
                    .map((p) => {
                      const isSelected = presetId === p.id
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            setPresetId(p.id)
                            setWidth(p.width)
                            setHeight(p.height)
                          }}
                          className={`p-4 rounded-xl border-2 text-left transition ${
                            isSelected
                              ? 'border-[#EF3785] bg-[#EF378510] shadow-xs'
                              : 'border-[#18244a20] bg-white hover:border-[#00A9D6]'
                          }`}
                        >
                          <span className="font-bold text-sm block text-[#18244A]">{p.name}</span>
                          <span className="mt-1 block font-mono text-xs text-[#667089]">
                            {p.width} × {p.height} cm
                          </span>
                          {p.fixedPrice && (
                            <span className="mt-2 block text-xs font-bold text-[#00A9D6]">
                              {clp(p.fixedPrice)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Custom Mode */}
            {sizeMode === 'custom' && product && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#667089] uppercase tracking-wider">
                    Dimensiones exactas en centímetros:
                  </p>
                  <button
                    type="button"
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition ${
                      lockAspectRatio
                        ? 'border-[#00A9D6] bg-[#00A9D615] text-[#00A9D6]'
                        : 'border-[#18244a25] text-[#667089]'
                    }`}
                  >
                    {lockAspectRatio ? '🔒 Proporción bloqueada' : '🔓 Proporción libre'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#18244A]">
                      Ancho (cm)
                      <input
                        type="number"
                        value={width}
                        min={product.minWidth}
                        max={product.maxWidth}
                        step={product.dimensionStep || 1}
                        onChange={(e) => handleWidthChange(Math.max(1, +e.target.value))}
                        className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-3 font-mono font-bold text-lg"
                      />
                    </label>
                    <span className="text-[10px] text-[#667089] mt-1 block">
                      Min: {product.minWidth} cm · Max: {product.maxWidth} cm
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18244A]">
                      Alto (cm)
                      <input
                        type="number"
                        value={height}
                        min={product.minHeight}
                        max={product.maxHeight}
                        step={product.dimensionStep || 1}
                        onChange={(e) => handleHeightChange(Math.max(1, +e.target.value))}
                        className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-3 font-mono font-bold text-lg"
                      />
                    </label>
                    <span className="text-[10px] text-[#667089] mt-1 block">
                      Min: {product.minHeight} cm · Max: {product.maxHeight} cm
                    </span>
                  </div>
                </div>

                {/* Real-time DPI Quality Meter */}
                {currentDpi !== null && (
                  <div className="mt-4 p-3.5 rounded-xl bg-[#FAFAF7] border border-[#18244a15] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">
                        {currentDpi >= 150 ? '🟢' : currentDpi >= 100 ? '🟡' : currentDpi >= 70 ? '🟠' : '🔴'}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#18244A]">
                          {currentDpi >= 150
                            ? 'Resolución Óptima de Impresión'
                            : currentDpi >= 100
                            ? 'Buena Nitidez de Cartelería'
                            : currentDpi >= 70
                            ? 'Resolución Aceptable para Distancia'
                            : 'Atención: Podría verse pixelado'}
                        </p>
                        <p className="text-[11px] text-[#667089]">
                          Densidad calculada: ~{currentDpi} DPI para {width} × {height} cm
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* STEP 4: MOCKUP VIRTUAL 3D INTERACTIVO */}
          {show3DPreview && (
            <section className="rounded-2xl border border-[#18244a22] bg-white p-6 md:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="display text-2xl font-bold">04 / Maqueta Virtual 3D</h2>
                  <p className="mt-0.5 text-xs text-[#667089]">
                    Gira el soporte para ver cómo se presenta tu diseño en el espacio real.
                  </p>
                </div>
              </div>

              <Product3DViewer
                imageUrl={upload?.url}
                productType={productId}
                widthCm={width}
                heightCm={height}
                crop={crop}
                title={product?.name}
              />
            </section>
          )}

          {/* STEP 5: CANTIDAD Y EXTRAS */}
          <section className="rounded-2xl border border-[#18244a22] bg-white p-6 md:p-8 shadow-xs">
            <h2 className="display text-2xl font-bold">05 / Cantidad y Acabados</h2>

            <div className="mt-5 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#18244A]">
                  Cantidad de unidades
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10 rounded-lg border border-[#18244a30] bg-white font-bold hover:bg-neutral-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, +e.target.value))}
                    className="focus-ring h-10 w-24 rounded-lg border border-[#18244a30] bg-white text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-10 w-10 rounded-lg border border-[#18244a30] bg-white font-bold hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Product Options */}
              {product && product.options.filter((o) => o.active).length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18244A] mb-2">
                    Acabados y adicionales
                  </label>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {product.options
                      .filter((o) => o.active)
                      .map((o) => (
                        <label
                          key={o.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-[#18244a15] bg-[#FAFAF7] hover:border-[#18244A] transition cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={optionIds.includes(o.id)}
                            onChange={(e) =>
                              setOptionIds(
                                e.target.checked
                                  ? [...optionIds, o.id]
                                  : optionIds.filter((id) => id !== o.id)
                              )
                            }
                            className="h-4 w-4 accent-[#EF3785]"
                          />
                          <span className="font-medium text-[#18244A]">{o.name}</span>
                          <span className="text-xs text-[#667089] ml-auto font-bold">
                            +{clp(o.price)}/u
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Delivery Methods */}
              {deliveries.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#18244A] mb-2">
                    Método de Entrega
                  </label>
                  <select
                    className="focus-ring w-full rounded-lg border border-[#18244a30] bg-white p-3 text-sm font-medium"
                    value={deliveryId}
                    onChange={(e) => setDeliveryId(e.target.value)}
                  >
                    {deliveries.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.price ? clp(d.price) : 'Sin costo adicional'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* STEP 6: DATOS DE CONTACTO */}
          <section className="rounded-2xl border border-[#18244a22] bg-white p-6 md:p-8 shadow-xs">
            <h2 className="display text-2xl font-bold">06 / Tus Datos de Contacto</h2>
            <p className="mt-1 text-xs text-[#667089]">
              Te enviaremos la confirmación y nos comunicaremos para afinar los detalles de impresión.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#18244A]">
                Nombre y Apellido
                <input
                  {...register('name')}
                  aria-label="Nombre"
                  className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-2.5 text-sm"
                  placeholder="Ej: Carolina Morales"
                />
                {errors.name && <small className="text-[#EF3785]">{errors.name.message}</small>}
              </label>

              <label className="text-xs font-bold text-[#18244A]">
                Teléfono / WhatsApp
                <input
                  {...register('phone')}
                  aria-label="Teléfono"
                  className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-2.5 text-sm"
                  placeholder="+56 9 1234 5678"
                />
                {errors.phone && <small className="text-[#EF3785]">{errors.phone.message}</small>}
              </label>

              <label className="text-xs font-bold text-[#18244A]">
                Correo Electrónico
                <input
                  {...register('email')}
                  aria-label="Email"
                  className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-2.5 text-sm"
                  placeholder="contacto@tunegocio.cl"
                />
                {errors.email && <small className="text-[#EF3785]">{errors.email.message}</small>}
              </label>

              <label className="text-xs font-bold text-[#18244A]">
                Empresa / Negocio (opcional)
                <input
                  {...register('company')}
                  aria-label="Empresa (opcional)"
                  className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-2.5 text-sm"
                  placeholder="Ej: Minimarket El Sol"
                />
              </label>
            </div>

            <label className="mt-4 block text-xs font-bold text-[#18244A]">
              Dirección {delivery?.requiresAddress ? '(Requerida para despacho)' : '(Opcional)'}
              <input
                {...register('address')}
                aria-label="Dirección"
                className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-2.5 text-sm"
                placeholder="Calle, número y comuna"
              />
            </label>

            <label className="mt-4 block text-xs font-bold text-[#18244A]">
              Instrucciones o Comentarios especiales (opcional)
              <textarea
                {...register('comment')}
                aria-label="Comentario"
                rows={2}
                className="focus-ring mt-1.5 w-full rounded-lg border border-[#18244a30] bg-white p-2.5 text-sm"
                placeholder="Detalles sobre colores, fecha límite, perforaciones, etc."
              />
            </label>
          </section>
        </div>

        {/* ASIDE: RESUMEN DE COTIZACIÓN */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl bg-[#18244A] p-6 text-white md:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FFE04B]">
                Resumen de Cotización
              </p>
              {product && (
                <span className="text-xs font-bold text-white/80">{product.name}</span>
              )}
            </div>

            {snapshot ? (
              <>
                <p className="display mt-6 text-5xl font-bold text-[#00A9D6]">
                  {clp(snapshot.total)}
                </p>
                <div className="mt-6 space-y-2 border-t border-white/15 pt-4 text-xs text-white/80">
                  <div className="flex justify-between">
                    <span>Dimensiones</span>
                    <span className="font-mono font-bold text-white">
                      {width} × {height} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cantidad</span>
                    <span className="font-mono font-bold text-white">{quantity} u</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal soporte</span>
                    <span className="font-mono">{clp(snapshot.subtotal)}</span>
                  </div>
                  {snapshot.extras > 0 && (
                    <div className="flex justify-between text-[#FFE04B]">
                      <span>Acabados / Extras</span>
                      <span className="font-mono">+{clp(snapshot.extras)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Despacho</span>
                    <span className="font-mono">
                      {snapshot.shipping > 0 ? `+${clp(snapshot.shipping)}` : 'Sin costo'}
                    </span>
                  </div>
                </div>

                {snapshot.rules && snapshot.rules.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/60 space-y-1">
                    {snapshot.rules.map((r, i) => (
                      <p key={i}>• {r}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mt-8 text-sm text-white/70">
                {estimateState === 'loading'
                  ? 'Calculando tarifa en vivo…'
                  : 'Configura las medidas para ver la referencia de precio.'}
              </p>
            )}

            <p className="mt-6 text-[11px] text-white/50 leading-relaxed border-t border-white/10 pt-3">
              Valores netos de referencia. La cotización final y los archivos son revisados por el equipo antes de imprimir.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit(submit)}
            disabled={!snapshot || estimateState !== 'ready' || isSubmitting || !products.length}
            className="focus-ring mt-4 w-full rounded-full bg-[#EF3785] px-6 py-4 font-bold text-white text-base shadow-lg transition hover:bg-[#00A9D6] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Procesando cotización…' : 'Solicitar cotización ↗'}
          </button>
          <p className="mt-2 text-center text-xs text-[#667089]">
            No se genera pago hasta validar tu diseño con el taller.
          </p>
        </aside>
      </div>
    </main>
  )
}
