'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { getCatalog, Product } from '../lib/api'

const realWorks = [
  {
    title: 'Paloma Publicitaria YN Beauty',
    category: 'Caballete en A · Salón de Belleza',
    image: '/trabajos/paloma-yn-beauty.jpg',
    desc: 'Estructura tijera de madera reforzada con gráfica tensada en alta resolución, doble faz e iluminación satinada para vereda.',
    tag: 'Doble Faz · Madera Reforzada',
    format: '80 × 180 cm',
  },
  {
    title: 'Paloma Salazar Lubrifrenos',
    category: 'Estructura 2 Caras con Bisagras',
    image: '/trabajos/paloma-salazar.jpg',
    desc: 'Caballete publicitario para taller mecánico con bisagras metálicas superiores, resistente a viento y polvo en vía pública.',
    tag: 'Uso Rudo · Taller Mecánico',
    format: '80 × 160 cm',
  },
  {
    title: 'Paloma Carnicería Aarón',
    category: 'Publicidad Vereda · Comercio Local',
    image: '/trabajos/paloma-aaron.jpg',
    desc: 'Letrero de alto impacto peatonal con impresión digital fotográfica sobre tela PVC de 510g resistente a rayos UV.',
    tag: 'Alto Tráfico · Colores Vivos',
    format: '60 × 120 cm',
  },
]

const servicesCatalog = [
  {
    id: 'paloma',
    title: 'Palomas Publicitarias (Caballete en A)',
    subtitle: 'El clásico letrero de vereda plegable',
    desc: 'Estructuras de madera o aluminio con bisagras metálicas superiores y patas con cadenas de tope. Gráfica visible por ambos lados (doble faz) para captar clientes en ambos sentidos de la calle.',
    priceBadge: 'Desde $35.000 CLP',
    icon: '🪧',
    formats: ['60 × 100 cm', '80 × 120 cm', '80 × 180 cm'],
    features: ['Estructura plegable fácil de guardar', 'Lámina tensada sin arrugas', 'Topes de goma anti-deslizantes'],
    link: '/cotizar',
    badge: 'Más Vendido',
  },
  {
    id: 'cartel-poste',
    title: 'Carteles para Postes Urbanos',
    subtitle: 'Publicidad en esquinas y avenidas',
    desc: 'Letreros diseñados para montaje en postes de alumbrado público o columnas mediante abrazaderas metálicas de acero galvanizado y brazos en voladizo que soportan ráfagas de viento.',
    priceBadge: 'Desde $18.000 CLP',
    icon: '📍',
    formats: ['40 × 80 cm', '50 × 100 cm', '60 × 120 cm'],
    features: ['Incluye abrazaderas metálicas', 'Doble faz para visibilidad vehicular', 'Resistente a la intemperie'],
    link: '/cotizar',
    badge: 'Alta Visibilidad',
  },
  {
    id: 'pvc',
    title: 'Lienzos y Telas PVC con Ojales',
    subtitle: 'Gran formato para fachadas y eventos',
    desc: 'Lona frontlit de 510g de alto gramaje con dobladillo perimetral vulcanizado y ojetillos metálicos de latón para anclar con amarras plásticas o cuerdas en cualquier estructura.',
    priceBadge: 'Desde $12.000 CLP',
    icon: '🎪',
    formats: ['100 × 200 cm', '150 × 300 cm', 'Medidas libres hasta 5m'],
    features: ['Ojetillos de latón inoxidables', 'Tintas UV que no se decoloran', 'Plegable para fácil transporte'],
    link: '/cotizar',
    badge: 'Económico y Versátil',
  },
  {
    id: 'adhesivos',
    title: 'Adhesivos y Vinilos Comerciales',
    subtitle: 'Vitrinas, muros y rotulación vehicular',
    desc: 'Vinilos poliméricos de alta adherencia para cristaleras de tiendas, decoración de interiores de locales y branding sobre flotas de vehículos comerciales. Con opción de laminado protector.',
    priceBadge: 'Desde $8.500 CLP',
    icon: '✨',
    formats: ['Corte recto', 'Troquelado a la forma', 'Microperforado'],
    features: ['Laminado protector anti-rayas', 'Fácil de limpiar y mantener', 'Corte digital de alta precisión'],
    link: '/cotizar',
    badge: 'Terminación Pro',
  },
  {
    id: 'impresion-digital',
    title: 'Impresión Digital Gran Formato',
    subtitle: 'Pendones, señalética y letreros rígidos',
    desc: 'Impresión fotográfica en plotters de última generación con resolución de hasta 1440 DPI sobre diversos sustratos rígidos y flexibles listos para instalar.',
    priceBadge: 'Desde $15.000 CLP',
    icon: '🎨',
    formats: ['Pendón Roller', 'Sintra / PVC espumado', 'Acrílico'],
    features: ['Entrega express disponible', 'Asesoría en resolución de archivos', 'Colores calibrados en CMYK'],
    link: '/cotizar',
    badge: 'Express',
  },
]

const faqs = [
  {
    q: '¿Qué información o archivo necesito para cotizar?',
    a: 'Solo necesitas saber las medidas aproximadas en cm y el tipo de soporte que buscas. Puedes subir una imagen o logo (JPEG, PNG o WebP de hasta 15 MB) y el sistema analizará la resolución automáticamente para recomendarte el tamaño ideal.',
  },
  {
    q: '¿Qué pasa si mi diseño no tiene buena calidad o está pixelado?',
    a: 'El cotizador cuenta con un semáforo de nitidez en tiempo real que mide los DPI según el tamaño que elijas. Si la imagen es muy pequeña para el formato deseado, te lo advertirá antes de confirmar. Además, en taller revisamos cada archivo y te asesoramos para asegurar un resultado nítido.',
  },
  {
    q: '¿Cuánto demora la confección de una paloma o letrero?',
    a: 'El plazo estándar de fabricación es de 24 a 48 horas hábiles tras la aprobación del diseño y confirmación del pedido. Para requerimientos urgentes, consúltanos para gestionar entregas en el mismo día.',
  },
  {
    q: '¿Los carteles para poste vienen con las fijaciones incluidas?',
    a: 'Sí. Nuestros carteles para poste incluyen el juego completo de abrazaderas metálicas (collarines) y brazos de soporte diseñados para abrazar postes de alumbrado estándar de forma firme y segura.',
  },
  {
    q: '¿Hacen despachos en Santiago o a regiones?',
    a: 'Sí, despachamos a todas las comunas de la Región Metropolitana con tarifas accesibles o puedes retirar sin costo en nuestro taller. Para envíos a regiones despachamos mediante Starken o Pullman Cargo por pagar.',
  },
  {
    q: '¿Cuáles son los medios de pago disponibles?',
    a: 'Aceptamos transferencia electrónica, tarjetas de débito/crédito y efectivo en taller. Emitimos boleta o factura electrónica según las necesidades de tu empresa o negocio.',
  },
]

export default function Home() {
  const [, setProducts] = useState<Product[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedWorkIdx, setSelectedWorkIdx] = useState(0)

  useEffect(() => {
    getCatalog()
      .then((x) => setProducts(x.products.filter((p) => p.active)))
      .catch(() => {})
  }, [])

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#18244A] selection:bg-[#EF3785] selection:text-white">
      {/* ================= HEADER ================= */}
      <header className="fixed top-0 z-50 w-full border-b border-[#18244a18] bg-[#FAFAF7]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.jpg"
              alt="MegaColours Logo"
              className="h-11 w-11 rounded-full object-cover border border-[#18244A30] shadow-xs transition group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="display text-2xl font-bold tracking-tight text-[#18244A] leading-none">
                Mega<span className="text-[#EF3785]">Colours</span>
                <span className="text-[#00A9D6]">.</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-[#667089] uppercase mt-0.5">
                Publicidad Exterior
              </span>
            </div>
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus-ring md:hidden text-2xl p-2 rounded-lg text-[#18244A]"
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          {/* Nav links */}
          <nav
            className={`${
              menuOpen ? 'flex' : 'hidden'
            } absolute left-0 top-full w-full flex-col gap-5 border-b border-[#18244a1c] bg-[#FAFAF7] p-6 shadow-xl md:static md:flex md:w-auto md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          >
            <a
              className="focus-ring text-sm font-semibold text-[#18244A] hover:text-[#EF3785] transition"
              href="#trabajos"
              onClick={() => setMenuOpen(false)}
            >
              Trabajos Reales
            </a>
            <a
              className="focus-ring text-sm font-semibold text-[#18244A] hover:text-[#EF3785] transition"
              href="#productos"
              onClick={() => setMenuOpen(false)}
            >
              Productos
            </a>
            <a
              className="focus-ring text-sm font-semibold text-[#18244A] hover:text-[#EF3785] transition"
              href="#ventajas"
              onClick={() => setMenuOpen(false)}
            >
              Ventajas
            </a>
            <a
              className="focus-ring text-sm font-semibold text-[#18244A] hover:text-[#EF3785] transition"
              href="#proceso"
              onClick={() => setMenuOpen(false)}
            >
              Cómo pedir
            </a>
            <a
              className="focus-ring text-sm font-semibold text-[#18244A] hover:text-[#EF3785] transition"
              href="#preguntas"
              onClick={() => setMenuOpen(false)}
            >
              Preguntas
            </a>
            <Link
              className="focus-ring inline-flex items-center justify-center rounded-full bg-[#18244A] px-6 py-2.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#EF3785] hover:shadow-md"
              href="/cotizar"
              onClick={() => setMenuOpen(false)}
            >
              Cotizar en línea
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="grid-paper relative overflow-hidden px-5 pb-20 pt-32 md:px-10 md:pb-28 md:pt-44">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          {/* Left Column: Headlines & Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Status Pill */}
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Taller Operativo · Fabricación en Santiago</span>
            </div>

            {/* Main Headline (Satisfies Playwright "Haz que") */}
            <h1 className="display max-w-3xl text-[clamp(3.5rem,8.5vw,7.8rem)] leading-[.85] text-[#18244A]">
              Haz que<br />
              <span className="text-[#00A9D6]">tu negocio</span><br />
              <span className="text-[#EF3785]">se note.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#667089]">
              Fabricamos <strong className="text-[#18244A] font-semibold">palomas publicitarias de caballete</strong>,{' '}
              <strong className="text-[#18244A] font-semibold">carteles para postes</strong> con abrazaderas de acero, lonas PVC y adhesivos de alta resistencia para intemperie.
            </p>

            {/* Main CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/cotizar"
                className="focus-ring inline-flex items-center gap-3 rounded-full bg-[#EF3785] px-8 py-4 text-base font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d82a72] hover:shadow-xl"
              >
                Empieza a cotizar <span aria-hidden className="text-xl">↗</span>
              </Link>
              <a
                href="#trabajos"
                className="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-[#18244a25] bg-white px-7 py-4 text-base font-bold text-[#18244A] transition hover:border-[#18244A] hover:bg-neutral-50 shadow-xs"
              >
                Ver trabajos reales ↓
              </a>
            </div>

            {/* Highlights Grid */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-[#18244a18] pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#18244A]">
                <span className="text-base">📐</span>
                <span>Medidas personalizadas en cm</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#18244A]">
                <span className="text-base">☀️</span>
                <span>Tintas UV para exterior</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-[#18244A]">
                <span className="text-base">⚡</span>
                <span>Entrega rápida 24/48 hrs</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Animated Product Showcase Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto w-full max-w-[500px]"
          >
            {/* Main Showcase Frame */}
            <div className="relative rounded-3xl border-2 border-[#18244a20] bg-white p-4 sm:p-6 shadow-[0_20px_50px_rgba(24,36,74,0.12)] overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#18244a12]">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-[#EF3785]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#18244A]">
                    Taller MegaColours · Acabado Real
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-[#18244A10] px-2.5 py-1 rounded-full text-[#18244A] font-bold">
                  80 × 180 cm
                </span>
              </div>

              {/* Showcase Image with Zoom Effect */}
              <div className="relative mt-3 aspect-[4/5] w-full rounded-2xl overflow-hidden bg-neutral-900 shadow-inner group">
                <img
                  src={realWorks[selectedWorkIdx].image}
                  alt={realWorks[selectedWorkIdx].title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#18244A] via-transparent to-transparent opacity-80" />

                {/* Floating Tags with Smooth Animations */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-[#18244A] shadow-md border border-white/40"
                >
                  ⭐ Estructura Reforzada
                </motion.div>

                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute top-4 right-4 bg-[#18244A]/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-[#FFE04B] shadow-md border border-white/20"
                >
                  🟢 150 DPI Fotográfico
                </motion.div>

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-4 inset-x-4 p-4 rounded-xl bg-white/95 backdrop-blur-sm border border-[#18244a15] shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#EF3785] uppercase tracking-wider">
                        {realWorks[selectedWorkIdx].category}
                      </p>
                      <h4 className="text-base font-bold text-[#18244A]">
                        {realWorks[selectedWorkIdx].title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#00A9D615] text-[#00A9D6] px-2 py-1 rounded">
                      {realWorks[selectedWorkIdx].format}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Selector Buttons for Quick Browsing */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-[#18244a10]">
                <span className="text-xs font-medium text-[#667089]">Ejemplos de taller:</span>
                <div className="flex gap-1.5">
                  {realWorks.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedWorkIdx(idx)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                        selectedWorkIdx === idx
                          ? 'bg-[#18244A] text-white shadow-xs'
                          : 'bg-neutral-100 text-[#18244A] hover:bg-neutral-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= TRABAJOS REALES / GALERÍA ================= */}
      <section id="trabajos" className="bg-[#18244A] px-5 py-24 text-white md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#FFE04B22] px-3.5 py-1 text-xs font-bold uppercase tracking-[.2em] text-[#FFE04B] border border-[#FFE04B44]">
                <span>🔨 Fabricación en Taller</span>
              </div>
              <h2 className="display text-5xl md:text-7xl leading-[.9]">
                Trabajos en la calle.<br />
                <span className="text-[#00A9D6]">Calidad que dura.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/75">
              Sin maquetas falsas: estas son fotos reales de palomas y letreros saliendo de nuestro taller hacia locales comerciales, peluquerías y talleres en Santiago.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {realWorks.map((work, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col rounded-2xl border border-white/15 bg-white/5 overflow-hidden shadow-xl"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/50">
                  <img
                    src={work.image}
                    alt={work.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18244A] via-transparent to-transparent opacity-85" />
                  <span className="absolute top-3 left-3 rounded-full bg-[#18244Acc] backdrop-blur-xs px-3 py-1 text-xs font-mono text-[#FFE04B] border border-white/20">
                    {work.tag}
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-1 text-xs font-mono text-white/90">
                    {work.format}
                  </span>
                </div>
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-xs font-bold text-[#00A9D6] uppercase tracking-wider">
                      {work.category}
                    </span>
                    <h3 className="display text-2xl font-bold mt-1 text-white">{work.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/70">{work.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <Link
                      href="/cotizar"
                      className="focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-[#FFE04B] hover:text-white transition"
                    >
                      Cotizar modelo similar →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PRODUCTOS Y CATÁLOGO ================= */}
      <section id="productos" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[.25em] text-[#00A9D6]">
              Catálogo de Soportes
            </span>
            <h2 className="display text-5xl md:text-7xl leading-[.9]">
              Soluciones para<br />
              <span className="text-[#EF3785]">hacerte visible.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#667089] leading-relaxed">
            Cada soporte está pensado para un uso específico: vereda, fachada, poste o vitrina. Elige el que mejor se adapta a tu negocio.
          </p>
        </div>

        {/* Real Product Cards with Pricing Starting Points & Specs */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicesCatalog.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-between rounded-3xl border border-[#18244a20] bg-white p-6 md:p-8 shadow-xs hover:border-[#EF3785] hover:shadow-lg transition"
            >
              <div>
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl p-2.5 rounded-2xl bg-[#18244A08] border border-[#18244a15]">
                    {item.icon}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EF378512] text-[#EF3785] border border-[#EF378530]">
                    {item.badge}
                  </span>
                </div>

                <h3 className="display text-2xl font-bold mt-5 text-[#18244A]">
                  {item.title}
                </h3>
                <p className="text-xs font-bold text-[#00A9D6] mt-0.5">{item.subtitle}</p>
                <p className="mt-3 text-xs text-[#667089] leading-relaxed">{item.desc}</p>

                {/* Features list */}
                <ul className="mt-4 space-y-1.5 border-t border-[#18244a10] pt-4">
                  {item.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[#18244A]">
                      <span className="text-[#00A9D6] font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>

                {/* Common formats */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.formats.map((fmt, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Price & CTA */}
              <div className="mt-6 pt-4 border-t border-[#18244a12] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#667089] block">
                    Precio orientativo
                  </span>
                  <span className="text-sm font-bold font-mono text-[#18244A]">
                    {item.priceBadge}
                  </span>
                </div>
                <Link
                  href={item.link}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-[#18244A] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#EF3785]"
                >
                  Personalizar →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= VENTAJAS / POR QUÉ MEGACOLOURS ================= */}
      <section id="ventajas" className="bg-[#18244A06] border-y border-[#18244a15] px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[.25em] text-[#EF3785]">
              Garantía de Taller
            </span>
            <h2 className="display text-5xl md:text-6xl mt-2 leading-[.95]">
              ¿Por qué confiar en nosotros?
            </h2>
            <p className="mt-4 text-sm text-[#667089]">
              Hacemos letreros que no se doblan con el viento ni se destiñen con el sol del verano.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '🛡️',
                title: 'Estructuras Sólidas',
                desc: 'Marcos de madera cepillada o aluminio reforzado con bisagras de alta resistencia y fijaciones que no ceden.',
              },
              {
                icon: '☀️',
                title: 'Tintas con Filtro UV',
                desc: 'Impresión digital sobre lona de 510g resistente a la radiación solar, lluvia y polución ambiental sin decolorarse.',
              },
              {
                icon: '🔍',
                title: 'Control de Resolución',
                desc: 'Analizamos los DPI de tu diseño antes de imprimir para asegurarte que se verá nítido y sin pixelado.',
              },
              {
                icon: '🚚',
                title: 'Despacho o Retiro',
                desc: 'Retiro expedito en taller sin costo o despacho coordinado a cualquier comuna de la Región Metropolitana.',
              },
            ].map((v, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#18244a18] bg-white p-6 shadow-xs hover:border-[#00A9D6] transition"
              >
                <span className="text-3xl block mb-4">{v.icon}</span>
                <h3 className="text-lg font-bold text-[#18244A]">{v.title}</h3>
                <p className="mt-2 text-xs text-[#667089] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CÓMO PEDIR (PROCESO EN 3 PASOS) ================= */}
      <section id="proceso" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <div className="mb-14">
          <span className="text-xs font-bold uppercase tracking-[.25em] text-[#00A9D6]">
            Paso a Paso
          </span>
          <h2 className="display text-5xl md:text-7xl leading-[.9] mt-2">
            Del archivo<br />a la calle.
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Ingresa medidas y sube tu diseño',
              desc: 'Elige tu soporte, escribe el ancho y alto en cm o escoge un formato estándar. Sube tu logo o arte gráfico en JPEG, PNG o WebP.',
            },
            {
              step: '02',
              title: 'Calcula tarifa y simula en 3D',
              desc: 'Nuestro cotizador calcula el valor de forma transparente, verifica la calidad DPI y te permite inspeccionar la pieza en 360°.',
            },
            {
              step: '03',
              title: 'Confirmación y producción',
              desc: 'Recibimos tu solicitud, validamos el archivo con el taller y coordinamos entrega o retiro en 24 a 48 horas.',
            },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-3xl border-t-4 border-[#18244A] bg-white p-8 shadow-xs border-x border-b border-[#18244a15]"
            >
              <span className="display text-5xl text-[#00A9D6] font-bold">{s.step}</span>
              <h3 className="mt-6 text-xl font-bold text-[#18244A]">{s.title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-[#667089]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PREGUNTAS FRECUENTES (FAQ) ================= */}
      <section id="preguntas" className="mx-auto max-w-4xl px-5 py-20 md:py-28">
        <div className="mb-10 text-center">
          <span className="text-xs font-bold uppercase tracking-[.25em] text-[#EF3785]">
            Resolución de Dudas
          </span>
          <h2 className="display text-5xl md:text-6xl mt-2">
            Preguntas frecuentes.
          </h2>
          <p className="text-xs text-[#667089] mt-2">
            Todo lo que necesitas saber antes de encargar tu letrero publicitario.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#18244a18] bg-white overflow-hidden transition"
            >
              <button
                type="button"
                className="focus-ring flex w-full items-center justify-between p-5 text-left font-bold text-base text-[#18244A] hover:bg-neutral-50"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span>{faq.q}</span>
                <span className="text-xl font-mono text-[#00A9D6] ml-4">
                  {openFaq === idx ? '−' : '+'}
                </span>
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs text-[#667089] leading-relaxed border-t border-[#18244a0d]">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="bg-[#FFE04B] px-5 py-20 md:px-10 md:py-28 border-t border-[#18244a20]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#18244A]">
              Tu próximo letrero comercial
            </p>
            <h2 className="display max-w-3xl text-6xl leading-[.84] md:text-8xl text-[#18244A]">
              Hazlo<br />
              <span className="text-[#EF3785]">realidad.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm text-[#18244A]/80 font-medium">
              Calcula el valor exacto de tu letrero en línea o solicita asesoría directa para tu proyecto comercial.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/cotizar"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-[#18244A] px-8 py-4 font-bold text-white shadow-xl transition hover:bg-[#EF3785] hover:shadow-2xl"
            >
              Cotizar mi proyecto ↗
            </Link>
            <a
              href="https://wa.me/56912345678"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-[#18244A] bg-white/60 px-6 py-4 font-bold text-[#18244A] transition hover:bg-white"
            >
              Consultar por WhatsApp 💬
            </a>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#18244a20] px-5 py-12 md:px-10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between items-center gap-6 text-sm text-[#667089] sm:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="MegaColours"
              className="h-10 w-10 rounded-full object-cover border border-[#18244A33]"
            />
            <div>
              <span className="display text-lg text-[#18244A] font-bold">
                Mega<span className="text-[#EF3785]">Colours</span>.
              </span>
              <p className="text-[11px] text-[#667089]">Taller de Publicidad Exterior & Gran Formato</p>
            </div>
          </div>
          <div className="text-center sm:text-right text-xs">
            <p className="font-semibold text-[#18244A]">Santiago, Chile</p>
            <p className="mt-0.5">Palomas Publicitarias · Carteles para Poste · Lonas PVC · Vinilos</p>
            <p className="mt-1 text-[11px] text-[#667089]">© {new Date().getFullYear()} MegaColours. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
