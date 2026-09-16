'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, MotionConfig } from 'motion/react'
import { getCatalog, Product } from '../lib/api'

const productsCatalog = [
  {
    num: '01',
    name: 'Palomas Publicitarias',
    tag: 'Caballete en A · Vereda',
    desc: 'Estructura tijera de madera cepillada o aluminio reforzado con bisagras metálicas superiores y cadenas de seguridad. Gráfica tensada doble faz para captar transeúntes en ambos sentidos de la calle.',
    specs: ['Doble faz (2 caras)', 'Bisagras metálicas reforzadas', 'Formatos 60×100, 80×120, 80×180 cm'],
    badge: 'Madera / Metal',
    accent: '#EF3785',
  },
  {
    num: '02',
    name: 'Carteles para Poste',
    tag: 'Vía Pública · Esquinas',
    desc: 'Letreros rígidos de doble vista diseñados para montaje en postes de alumbrado y columnas públicas mediante abrazaderas metálicas de acero galvanizado y brazos en voladizo.',
    specs: ['Incluye abrazaderas de acero', 'Resistente a ráfagas de viento', 'Formatos 40×80, 50×100, 60×120 cm'],
    badge: 'Acero Galvanizado',
    accent: '#00A9D6',
  },
  {
    num: '03',
    name: 'Lonas y Telas PVC',
    tag: 'Gran Formato · Fachadas',
    desc: 'Lona frontlit de 510g de alto gramaje con dobladillo perimetral reforzado y ojetillos metálicos inoxidables de latón cada 50 cm para anclaje firme con cuerdas o amarras.',
    specs: ['Ojetillos de latón inoxidable', 'Tintas con protección solar UV', 'Medidas libres hasta 5 metros'],
    badge: 'Lona 510g',
    accent: '#18244A',
  },
  {
    num: '04',
    name: 'Adhesivos y Vinilos',
    tag: 'Vitrinas y Vehículos',
    desc: 'Vinilo polimérico de alta adherencia con tintas resistentes para cristales de tiendas, vitrinas comerciales y rotulación de vehículos. Con opción de laminado protector.',
    specs: ['Corte recto o troquelado', 'Laminado anti-rayas opcional', 'Fácil aplicación sobre superficies lisas'],
    badge: 'Alta Adherencia',
    accent: '#00A9D6',
  },
  {
    num: '05',
    name: 'Impresión Digital',
    tag: 'Pendones y Placas',
    desc: 'Impresión en plotters de alta resolución para pendones roller, paneles sintra / PVC espumado y señalética comercial con colores vibrantes y calibración CMYK profesional.',
    specs: ['Hasta 1440 DPI de nitidez', 'Sustratos rígidos y flexibles', 'Entrega rápida en taller'],
    badge: 'Plotter HD',
    accent: '#EF3785',
  },
]

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
    title: 'Paloma Doble Faz Salazar Lubrifrenos',
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

const faqs = [
  {
    q: '¿Qué información necesito para cotizar mi letrero?',
    a: 'Solo necesitas saber las medidas aproximadas en cm y el tipo de soporte que buscas. Al subir tu imagen o logo, el sistema analiza los píxeles y te recomienda las dimensiones ideales según la nitidez.',
  },
  {
    q: '¿Cómo funciona la previsualización del letrero?',
    a: 'El cotizador cuenta con un visor virtual 3D que modela la estructura exacta (caballete en A con bisagras, poste con abrazaderas o lienzo con ojales) y proyecta tu gráfica para que revises las proporciones antes de producir.',
  },
  {
    q: '¿Cuánto demora la fabricación y entrega?',
    a: 'El plazo habitual de producción es de 24 a 48 horas hábiles desde que se confirma el arte y el pedido. Si necesitas entrega prioritaria en el día, consúltanos para coordinar según disponibilidad de taller.',
  },
  {
    q: '¿Los letreros resisten lluvia y sol directo?',
    a: 'Sí. Empleamos tintas eco-solventes con filtro UV sobre lona de 510g y maderas tratadas o aluminio con bisagras de alta resistencia para intemperie, sol de verano y lluvia.',
  },
  {
    q: '¿Los carteles para poste vienen listos para instalar?',
    a: 'Sí, entregamos el cartel con las abrazaderas metálicas y brazos de soporte incluidos, listos para montar directo sobre postes de alumbrado público estándar.',
  },
  {
    q: '¿Tienen despacho a comunas o retiro en taller?',
    a: 'Puedes retirar sin costo directamente en nuestro taller en Santiago o solicitar despacho coordinado a cualquier comuna de la Región Metropolitana.',
  },
]

export default function Home() {
  const [, setProducts] = useState<Product[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    getCatalog()
      .then((x) => setProducts(x.products.filter((p) => p.active)))
      .catch(() => {})
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen bg-[#FAFAF7] text-[#18244A] selection:bg-[#EF3785] selection:text-white">
        {/* ================= HEADER ================= */}
        <header className="fixed top-0 z-50 w-full border-b border-[#18244a1c] bg-[#FAFAF7eF] backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo.jpg"
                alt="MegaColours Logo"
                className="h-11 w-11 rounded-full object-cover border border-[#18244A33] shadow-xs transition group-hover:scale-105"
              />
              <span className="display text-2xl font-bold tracking-tight">
                Mega<span className="text-[#EF3785]">Colours</span>
                <span className="text-[#00A9D6]">.</span>
              </span>
            </Link>

            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(!menuOpen)}
              className="focus-ring md:hidden text-2xl text-[#18244A]"
            >
              {menuOpen ? '✕' : '☰'}
            </button>

            <nav
              className={`${
                menuOpen ? 'flex' : 'hidden'
              } absolute left-0 top-full w-full flex-col gap-5 border-b border-[#18244a1c] bg-[#FAFAF7] p-6 shadow-xl md:static md:flex md:w-auto md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
            >
              <a
                className="focus-ring text-sm font-semibold hover:text-[#EF3785] transition"
                href="#trabajos"
                onClick={() => setMenuOpen(false)}
              >
                Trabajos Reales
              </a>
              <a
                className="focus-ring text-sm font-semibold hover:text-[#EF3785] transition"
                href="#servicios"
                onClick={() => setMenuOpen(false)}
              >
                Servicios
              </a>
              <a
                className="focus-ring text-sm font-semibold hover:text-[#EF3785] transition"
                href="#proceso"
                onClick={() => setMenuOpen(false)}
              >
                Cómo funciona
              </a>
              <a
                className="focus-ring text-sm font-semibold hover:text-[#EF3785] transition"
                href="#preguntas"
                onClick={() => setMenuOpen(false)}
              >
                Preguntas
              </a>
              <Link
                className="focus-ring rounded-full bg-[#18244A] px-6 py-2.5 text-center text-sm font-bold text-white transition hover:bg-[#EF3785]"
                href="/cotizar"
                onClick={() => setMenuOpen(false)}
              >
                Cotizar ahora
              </Link>
            </nav>
          </div>
        </header>

        {/* ================= HERO SECTION ================= */}
        <section className="grid-paper relative overflow-hidden px-5 pb-20 pt-36 md:px-10 md:pb-28 md:pt-48">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            {/* Left Column: Bold Typography & Actions */}
            <div>
              <h1 className="display max-w-3xl text-[clamp(3.8rem,9vw,8.5rem)] leading-[.82]">
                Haz que<br />
                <span className="text-[#00A9D6]">se note.</span>
              </h1>
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-[#667089]">
                Impresión de gran formato y publicidad exterior para negocios que quieren ocupar espacio.
                Palomas para vereda, carteles para poste con abrazaderas de acero, lonas PVC y adhesivos de alta resistencia hechos en taller.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/cotizar"
                  className="focus-ring inline-flex items-center gap-3 rounded-full bg-[#EF3785] px-8 py-4 font-bold text-white transition hover:-translate-y-0.5 shadow-lg"
                >
                  Empieza a cotizar <span aria-hidden>↗</span>
                </Link>
                <a
                  href="#trabajos"
                  className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#18244a30] bg-white px-6 py-4 font-bold text-[#18244A] transition hover:border-[#18244A]"
                >
                  Ver trabajos reales ↓
                </a>
              </div>
            </div>

            {/* Right Column: Authentic Editorial Graphic Posters (Graphic Studio Identity) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative mx-auto h-[390px] w-full max-w-[530px] sm:h-[500px]"
            >
              {/* Back Plate (White Poster with Yellow Hard Shadow) */}
              <motion.div
                whileHover={{ rotate: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="absolute left-[8%] top-[12%] h-[68%] w-[73%] rotate-[-10deg] border border-[#18244a44] bg-white p-6 shadow-[12px_18px_0_#FFE04B] sm:p-10 cursor-pointer"
              >
                <div className="h-full border-2 border-dashed border-[#00A9D6] p-4 sm:p-7 flex flex-col justify-between">
                  <p className="display text-5xl leading-none sm:text-7xl">
                    Tu<br />
                    <span className="text-[#00A9D6]">marca</span><br />
                    aquí<span className="text-[#EF3785]">.</span>
                  </p>
                  <div>
                    <div className="h-3 w-2/3 bg-[#18244A]" />
                    <div className="mt-3 h-3 w-1/2 bg-[#EF3785]" />
                  </div>
                </div>
              </motion.div>

              {/* Front Plate (Cyan Poster with Pink Hard Shadow) */}
              <motion.div
                whileHover={{ rotate: 6, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-[4%] right-[1%] h-[60%] w-[64%] rotate-[8deg] border border-[#18244a44] bg-[#00A9D6] p-5 shadow-[-12px_16px_0_#EF3785] sm:p-8 cursor-pointer"
              >
                <div className="flex h-full flex-col justify-between border-2 border-[#FAFAF7aa] p-4 sm:p-6">
                  <span className="text-xs font-bold uppercase tracking-[.2em] text-white">
                    Publicidad Exterior
                  </span>
                  <div>
                    <p className="display text-5xl leading-[.82] text-white sm:text-7xl">
                      Color<br />en la<br />
                      <span className="text-[#FFE04B]">calle</span>
                    </p>
                    <span className="mt-5 block text-xs font-bold text-white">SANTIAGO / CHILE</span>
                  </div>
                </div>
              </motion.div>

              {/* Graphic Registration Marks */}
              <span className="absolute left-0 top-0 font-mono text-xs text-[#667089] select-none">
                + registro
              </span>
              <span className="absolute bottom-2 right-0 font-mono text-xs text-[#667089] select-none">
                taller / {new Date().getFullYear()}
              </span>
            </motion.div>
          </div>
        </section>

        {/* ================= SECCIÓN TRABAJOS REALES / GALERÍA ================= */}
        <section id="trabajos" className="bg-[#18244A] px-5 py-24 text-white md:px-10 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#FFE04B]">
                  Producción Real · Hecho en Taller
                </p>
                <h2 className="display text-5xl md:text-7xl leading-[.9]">
                  Trabajos en la calle.<br />
                  <span className="text-[#00A9D6]">Calidad que se nota.</span>
                </h2>
              </div>
              <p className="max-w-md text-sm text-white/70 leading-relaxed">
                Estructuras sólidas, impresiones nítidas sobre tela PVC de alta densidad y acabados pensados para resistir sol, viento y tráfico diario.
              </p>
            </div>

            {/* Grid de Trabajos Reales */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {realWorks.map((work, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col rounded-2xl border border-white/15 bg-white/5 overflow-hidden shadow-xl transition hover:border-[#EF3785]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
                    <img
                      src={work.image}
                      alt={work.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#18244A] via-transparent to-transparent opacity-80" />
                    <span className="absolute top-3 left-3 rounded-full bg-[#18244Acc] px-3 py-1 text-xs font-mono text-[#FFE04B] border border-white/20">
                      {work.category}
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-mono text-white/90">
                      {work.format}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="display text-2xl font-bold">{work.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/70">{work.desc}</p>
                    </div>
                    <Link
                      href="/cotizar"
                      className="focus-ring mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#FFE04B] hover:text-white transition"
                    >
                      Cotizar modelo similar →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= SERVICIOS Y SOPORTES (CATÁLOGO LIMPIO Y CON SENTIDO) ================= */}
        <section id="servicios" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
          <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#00A9D6]">
                Lo que hacemos
              </p>
              <h2 className="display text-5xl md:text-7xl leading-[.9]">
                Soportes para<br />hacerte visible.
              </h2>
            </div>
            <span className="max-w-xs text-sm text-[#667089] leading-relaxed">
              Soluciones impresas pensadas para verse, durar y hacer avanzar tu negocio en la calle.
            </span>
          </div>

          {/* Cards Grid: Useful technical specifications with Swiss / Brutalist layout */}
          <div className="grid gap-px overflow-hidden border border-[#18244a22] bg-[#18244a22] sm:grid-cols-2 lg:grid-cols-3">
            {productsCatalog.map((item) => (
              <article
                key={item.num}
                className="group bg-[#FAFAF7] p-8 transition hover:bg-[#FFE04B] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="display text-3xl text-[#18244A]">{item.num}</span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full border border-[#18244a25] bg-white/70 font-semibold text-[#18244A]">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="display text-3xl mt-6 text-[#18244A] leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs font-bold text-[#00A9D6] group-hover:text-[#18244A] mt-1 transition">
                    {item.tag}
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-[#667089] group-hover:text-[#18244A] transition">
                    {item.desc}
                  </p>

                  <ul className="mt-5 space-y-1.5 border-t border-[#18244a15] pt-4">
                    {item.specs.map((spec, i) => (
                      <li
                        key={i}
                        className="text-xs text-[#18244A] flex items-center gap-2 font-medium"
                      >
                        <span className="font-bold text-[#00A9D6] group-hover:text-[#18244A]">
                          ✓
                        </span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-[#18244a15]">
                  <Link
                    href="/cotizar"
                    className="focus-ring inline-flex items-center gap-1.5 text-xs font-bold text-[#18244A] group-hover:text-[#18244A] group-hover:underline"
                  >
                    Personalizar medidas →
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-5 text-xs font-mono text-[#667089]">
            Catálogo conectado a disponibilidad y cotización en tiempo real.
          </p>
        </section>

        {/* ================= PROCESO ================= */}
        <section id="proceso" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#EF3785]">
            El proceso
          </p>
          <h2 className="display mb-14 text-5xl md:text-7xl leading-[.9]">
            Del archivo<br />a la calle.
          </h2>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Ingresa medidas y sube tu diseño',
                desc: 'Elige tu soporte, escribe el ancho y alto en cm o escoge un formato estándar. Sube tu logo o arte gráfico en JPEG, PNG o WebP.',
              },
              {
                step: '02',
                title: 'Calcula tarifa y simula',
                desc: 'Nuestro cotizador calcula el valor de forma transparente, verifica la nitidez en DPI y te permite inspeccionar la pieza en 3D.',
              },
              {
                step: '03',
                title: 'Producimos y entregamos',
                desc: 'Recibimos tu solicitud, validamos el archivo con el taller y coordinamos entrega o retiro en 24 a 48 horas.',
              },
            ].map((x) => (
              <div key={x.step} className="border-t-2 border-[#18244A] pt-5">
                <span className="display text-4xl text-[#00A9D6]">{x.step}</span>
                <h3 className="mt-8 text-xl font-bold">{x.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-[#667089]">{x.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CTA FINAL (AMARILLO VIBRANTE) ================= */}
        <section className="bg-[#FFE04B] px-5 py-20 md:px-10 md:py-28">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#18244A]">
                Tu próximo letrero
              </p>
              <h2 className="display max-w-3xl text-6xl leading-[.84] md:text-8xl text-[#18244A]">
                Hazlo<br />
                <span className="text-[#EF3785]">cotizable.</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/cotizar"
                className="focus-ring rounded-full bg-[#18244A] px-8 py-4 font-bold text-white transition hover:bg-[#EF3785] shadow-lg"
              >
                Cotizar proyecto ↗
              </Link>
            </div>
          </div>
        </section>

        {/* ================= PREGUNTAS FRECUENTES (FAQ) ================= */}
        <section id="preguntas" className="mx-auto max-w-4xl px-5 py-24 md:py-32">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#00A9D6]">
            Antes de partir
          </p>
          <h2 className="display mb-10 text-5xl md:text-7xl">
            Preguntas<br />frecuentes.
          </h2>

          <div className="space-y-1">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-t border-[#18244a33] py-5">
                <button
                  type="button"
                  className="focus-ring flex w-full items-center justify-between text-left font-bold text-lg text-[#18244A]"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <span className="text-2xl font-mono text-[#00A9D6] ml-4">
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <p className="max-w-2xl pt-4 leading-relaxed text-[#667089] text-sm">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-[#18244a22] px-5 py-10 md:px-10 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col justify-between items-center gap-6 text-sm text-[#667089] sm:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="MegaColours"
                className="h-10 w-10 rounded-full object-cover border border-[#18244A33]"
              />
              <span className="display text-lg text-[#18244A] font-bold">
                Mega<span className="text-[#EF3785]">Colours</span>.
              </span>
            </div>
            <span className="text-xs text-center sm:text-left">
              Impresión digital, tela PVC, carteles para poste y palomas publicitarias para negocios.
            </span>
            <span className="text-xs font-mono">
              © {new Date().getFullYear()} MegaColours · Santiago, Chile
            </span>
          </div>
        </footer>
      </main>
    </MotionConfig>
  )
}
