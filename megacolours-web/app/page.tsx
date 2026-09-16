'use client'
import Link from 'next/link'
import { motion, MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { getCatalog, Product } from '../lib/api'

const samples = [
  ['01', 'Tela PVC', 'Color que aguanta la calle.'],
  ['02', 'Adhesivos', 'Superficies que piden atención.'],
  ['03', 'Palomas', 'Presencia a la altura de tu negocio.'],
  ['04', 'Carteles de Poste', 'Publicidad en postes y esquinas con abrazaderas metálicas.'],
  ['05', 'Impresión digital', 'Una idea, muchas escalas.'],
]

const realWorks = [
  {
    title: 'Paloma Publicitaria YN Beauty',
    category: 'Caballete en A · Salón de Belleza',
    image: '/trabajos/paloma-yn-beauty.jpg',
    desc: 'Estructura tijera de madera con gráfica tensada en alta resolución e iluminación satinada.',
  },
  {
    title: 'Paloma Doble Faz Salazar Lubrifrenos',
    category: 'Estructura 2 Caras con Bisagras',
    image: '/trabajos/paloma-salazar.jpg',
    desc: 'Caballete publicitario para taller mecánico con bisagras superiores metálicas y soporte exterior.',
  },
  {
    title: 'Paloma Carnicería Aarón',
    category: 'Publicidad Vereda · Comercio Local',
    image: '/trabajos/paloma-aaron.jpg',
    desc: 'Letrero de alto impacto para flujo peatonal con impresión digital de nitidez fotográfica.',
  },
]

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState<number | null>(null)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    getCatalog()
      .then((x) => setProducts(x.products.filter((p) => p.active)))
      .catch(() => {})
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <main>
        {/* Header con Logo Oficial */}
        <header className="fixed top-0 z-50 w-full border-b border-[#18244a1c] bg-[#FAFAF7eF] backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-10">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="MegaColours Logo"
                className="h-11 w-11 rounded-full object-cover border border-[#18244A33] shadow-xs"
              />
              <span className="display text-2xl font-bold tracking-tight">
                Mega<span className="text-[#EF3785]">Colours</span>
                <span className="text-[#00A9D6]">.</span>
              </span>
            </Link>

            <button
              aria-label="Abrir menú"
              onClick={() => setMenu(!menu)}
              className="focus-ring md:hidden text-2xl"
            >
              ☰
            </button>

            <nav
              className={`${
                menu ? 'flex' : 'hidden'
              } absolute left-0 top-full w-full flex-col gap-5 border-b border-[#18244a1c] bg-[#FAFAF7] p-6 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}
            >
              <a className="focus-ring text-sm font-medium" href="#trabajos" onClick={() => setMenu(false)}>
                Trabajos Reales
              </a>
              <a className="focus-ring text-sm font-medium" href="#servicios" onClick={() => setMenu(false)}>
                Servicios
              </a>
              <a className="focus-ring text-sm font-medium" href="#proceso" onClick={() => setMenu(false)}>
                Cómo funciona
              </a>
              <a className="focus-ring text-sm font-medium" href="#preguntas" onClick={() => setMenu(false)}>
                Preguntas
              </a>
              <Link
                className="focus-ring rounded-full bg-[#18244A] px-6 py-2.5 text-center text-sm font-bold text-white transition hover:bg-[#EF3785]"
                href="/cotizar"
              >
                Cotizar ahora
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="grid-paper relative overflow-hidden px-5 pb-20 pt-36 md:px-10 md:pb-28 md:pt-48">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00A9D644] bg-[#00A9D612] px-3.5 py-1 text-xs font-bold text-[#00A9D6]">
                <span>✨ Nuevo</span>
                <span>Cotizador Inteligente con Mockup 3D</span>
              </div>
              <h1 className="display max-w-3xl text-[clamp(3.8rem,9vw,8.5rem)] leading-[.82]">
                Haz que<br />
                <span className="text-[#00A9D6]">se note.</span>
              </h1>
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-[#667089]">
                Impresión de gran formato y publicidad exterior para negocios que quieren ocupar espacio.
                Sube tu diseño, obtén recomendaciones de medida según resolución y visualiza tu pieza en 3D antes de producir.
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

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative mx-auto h-[390px] w-full max-w-[530px] sm:h-[500px]"
            >
              <div className="absolute left-[8%] top-[12%] h-[68%] w-[73%] rotate-[-10deg] border border-[#18244a44] bg-white p-6 shadow-[12px_18px_0_#FFE04B] sm:p-10">
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
              </div>

              <div className="absolute bottom-[4%] right-[1%] h-[60%] w-[64%] rotate-[8deg] border border-[#18244a44] bg-[#00A9D6] p-5 shadow-[-12px_16px_0_#EF3785] sm:p-8">
                <div className="flex h-full flex-col justify-between border-2 border-[#FAFAF7aa] p-4 sm:p-6">
                  <span className="text-xs font-bold uppercase tracking-[.2em] text-white">
                    Muestra de composición
                  </span>
                  <div>
                    <p className="display text-5xl leading-[.82] text-white sm:text-7xl">
                      Color<br />en<br />
                      <span className="text-[#FFE04B]">movimiento</span>
                    </p>
                    <span className="mt-5 block text-xs font-bold text-white">CMYK / 001</span>
                  </div>
                </div>
              </div>

              <span className="absolute left-0 top-0 font-mono text-xs">+ registro</span>
              <span className="absolute bottom-2 right-0 font-mono text-xs">muestra / 2026</span>
            </motion.div>
          </div>
        </section>

        {/* SECCIÓN TRABAJOS REALES / GALERÍA */}
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
              <p className="max-w-md text-sm text-white/70">
                Estructuras sólidas, impresiones nítidas sobre tela PVC de alta densidad y acabados pensados para resistir sol, viento y tráfico diario.
              </p>
            </div>

            {/* Grid de Trabajos Reales */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {realWorks.map((work, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col rounded-2xl border border-white/15 bg-white/5 overflow-hidden transition hover:border-[#EF3785]"
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
                  </div>
                  <div className="p-6">
                    <h3 className="display text-2xl font-bold">{work.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/70">{work.desc}</p>
                    <Link
                      href="/cotizar"
                      className="focus-ring mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#00A9D6] hover:text-[#EF3785]"
                    >
                      Cotizar estructura como esta →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
          <div className="mb-12 flex items-end justify-between gap-5">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#00A9D6]">
                Lo que hacemos
              </p>
              <h2 className="display text-5xl md:text-7xl">
                Piezas con<br />propósito.
              </h2>
            </div>
            <span className="hidden max-w-xs text-right text-sm text-[#667089] md:block">
              Soluciones impresas pensadas para verse, durar y hacer avanzar tu negocio.
            </span>
          </div>

          <div className="grid gap-px overflow-hidden border border-[#18244a22] bg-[#18244a22] sm:grid-cols-2 lg:grid-cols-4">
            {(products.length
              ? products.map((p, i) => [String(i + 1).padStart(2, '0'), p.name, p.description])
              : samples
            ).map((s, i) => (
              <article
                key={s[0]}
                className="group bg-[#FAFAF7] p-6 transition hover:bg-[#FFE04B] md:p-8"
              >
                <span className="font-mono text-xs text-[#667089]">{s[0]}</span>
                <div
                  className="my-16 h-20 w-full transition group-hover:translate-x-2"
                  style={{
                    background: i % 3 === 0 ? '#00A9D6' : i % 3 === 1 ? '#EF3785' : '#18244A',
                    clipPath:
                      i % 2
                        ? 'polygon(0 12%,100% 0,88% 100%,5% 86%)'
                        : 'polygon(6% 0,100% 14%,92% 100%,0 86%)',
                  }}
                />
                <h3 className="display text-3xl">{s[1]}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#667089]">{s[2]}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#667089]">
            Catálogo conectado a disponibilidad en tiempo real.
          </p>
        </section>

        {/* Proceso */}
        <section id="proceso" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#EF3785]">
            El proceso
          </p>
          <h2 className="display mb-14 text-5xl md:text-7xl">
            Del píxel<br />al espacio.
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              [
                '01',
                'Sube tu diseño',
                'El sistema analiza la resolución en píxeles y te recomienda las medidas ideales en cm.',
              ],
              [
                '02',
                'Visualiza en 3D',
                'Revisa cómo se ve tu diseño montado en la estructura real antes de confirmar.',
              ],
              [
                '03',
                'Producimos y entregamos',
                'Impresión en lona o adhesivo con montaje prolijo listo para instalar en tu negocio.',
              ],
            ].map((x) => (
              <div key={x[0]} className="border-t-2 border-[#18244A] pt-5">
                <span className="display text-4xl text-[#00A9D6]">{x[0]}</span>
                <h3 className="mt-8 text-xl font-bold">{x[1]}</h3>
                <p className="mt-3 leading-relaxed text-[#667089]">{x[2]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#FFE04B] px-5 py-20 md:px-10 md:py-28">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[.25em]">Tu próximo soporte</p>
              <h2 className="display max-w-3xl text-6xl leading-[.84] md:text-8xl">
                Hazlo<br />
                <span className="text-[#EF3785]">cotizable.</span>
              </h2>
            </div>
            <Link
              href="/cotizar"
              className="focus-ring rounded-full bg-[#18244A] px-8 py-4 font-bold text-white transition hover:bg-[#EF3785] shadow-lg"
            >
              Abrir cotizador 3D ↗
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="mx-auto max-w-4xl px-5 py-24 md:py-32">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-[#00A9D6]">
            Antes de partir
          </p>
          <h2 className="display mb-10 text-5xl md:text-7xl">
            Preguntas<br />frecuentes.
          </h2>
          {[
            [
              '¿Puedo pedir medidas especiales?',
              'Sí. Puedes ingresar cualquier ancho y alto en centímetros dentro de los límites de fabricación del soporte. El cotizador calcula la tarifa y la calidad DPI en tiempo real.',
            ],
            [
              '¿Cómo funciona la maqueta 3D?',
              'Al subir tu imagen puedes girarla en 3D en 360 grados sobre el caballete o lienzo para previsualizar las proporciones y la apariencia de tu letrero.',
            ],
            [
              '¿El precio que veo es definitivo?',
              'La cotización se recalcula en el servidor al enviarla. El valor mostrado es una referencia neta para orientar tu pedido antes de que el equipo confirme la orden de trabajo.',
            ],
            [
              '¿Qué formato de archivo debo enviar?',
              'Aceptamos imágenes JPEG, PNG y WebP de hasta 15 MB. Si necesitas vectorización o ajustes en tu archivo, el taller te asiste antes de la impresión.',
            ],
          ].map((x, i) => (
            <div key={x[0]} className="border-t border-[#18244a33] py-5">
              <button
                className="focus-ring flex w-full items-center justify-between text-left font-bold text-lg"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {x[0]}
                <span className="text-2xl">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <p className="max-w-2xl pt-4 leading-relaxed text-[#667089] text-sm">{x[1]}</p>
              )}
            </div>
          ))}
        </section>

        {/* Footer */}
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
            <span>Impresión digital, tela PVC y publicidad para negocios.</span>
            <span>© {new Date().getFullYear()} MegaColours · Santiago, Chile</span>
          </div>
        </footer>
      </main>
    </MotionConfig>
  )
}
