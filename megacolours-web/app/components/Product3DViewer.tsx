'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'

interface Product3DViewerProps {
  imageUrl?: string | null
  productType?: string
  widthCm?: number
  heightCm?: number
  aspectRatio?: number
  crop?: { x: number; y: number; zoom: number }
  title?: string
}

export function Product3DViewer({
  imageUrl,
  productType = 'paloma',
  widthCm = 80,
  heightCm = 180,
  crop = { x: 0.5, y: 0.5, zoom: 1 },
  title,
}: Product3DViewerProps) {
  const [rotY, setRotY] = useState(25)
  const [rotX, setRotX] = useState(-10)
  const [autoRotate, setAutoRotate] = useState(false)
  const [activeSupport, setActiveSupport] = useState<'paloma' | 'pvc' | 'panel'>(
    productType === 'paloma' ? 'paloma' : productType === 'pvc' ? 'pvc' : 'panel'
  )

  useEffect(() => {
    if (productType === 'paloma') setActiveSupport('paloma')
    else if (productType === 'pvc') setActiveSupport('pvc')
    else setActiveSupport('panel')
  }, [productType])

  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const animFrame = useRef<number | null>(null)

  // Auto rotation loop
  useEffect(() => {
    if (!autoRotate) return
    let lastTime = performance.now()
    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000
      lastTime = time
      setRotY((y) => (y + delta * 20) % 360)
      animFrame.current = requestAnimationFrame(loop)
    }
    animFrame.current = requestAnimationFrame(loop)
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [autoRotate])

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    setAutoRotate(false)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setRotY((y) => y + dx * 0.5)
    setRotX((x) => Math.max(-25, Math.min(25, x - dy * 0.4)))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const setView = useCallback((y: number, x: number) => {
    setAutoRotate(false)
    setRotY(y)
    setRotX(x)
  }, [])

  // Proportion calculation: target height is 270px in container, width derived from ratio
  const ratio = widthCm && heightCm ? widthCm / heightCm : 0.5
  const boxHeight = 270
  const boxWidth = Math.min(260, Math.max(120, Math.round(boxHeight * ratio)))

  // Image styling with crop offset
  const imgStyle: React.CSSProperties = imageUrl
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: `${crop.zoom * 100}%`,
        backgroundPosition: `${crop.x * 100}% ${crop.y * 100}%`,
        backgroundRepeat: 'no-repeat',
      }
    : {
        background: 'linear-gradient(135deg, #18244A 0%, #293863 100%)',
      }

  return (
    <div className="flex flex-col rounded-2xl border border-[#18244a22] bg-[#18244A08] p-4 sm:p-6 select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#18244a15]">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#00A9D6] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-[.2em] text-[#18244A]">
            Vista Virtual 3D {title ? `· ${title}` : ''}
          </h3>
        </div>

        {/* Support Type Selector */}
        <div className="flex items-center gap-1 text-xs bg-white rounded-lg p-1 border border-[#18244a20]">
          <button
            type="button"
            onClick={() => setActiveSupport('paloma')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeSupport === 'paloma'
                ? 'bg-[#18244A] text-white'
                : 'text-[#667089] hover:text-[#18244A]'
            }`}
          >
            Paloma Caballete
          </button>
          <button
            type="button"
            onClick={() => setActiveSupport('pvc')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeSupport === 'pvc'
                ? 'bg-[#18244A] text-white'
                : 'text-[#667089] hover:text-[#18244A]'
            }`}
          >
            Lona con Ojales
          </button>
          <button
            type="button"
            onClick={() => setActiveSupport('panel')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeSupport === 'panel'
                ? 'bg-[#18244A] text-white'
                : 'text-[#667089] hover:text-[#18244A]'
            }`}
          >
            Cartel Mural
          </button>
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div
        className="relative flex h-[350px] w-full items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ perspective: 1200 }}
      >
        {/* Subtle ground grid / vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.03)_100%)]" />

        {/* Shadow Plane on the floor */}
        <div
          className="absolute pointer-events-none rounded-full blur-md opacity-40 transition-transform duration-75"
          style={{
            width: boxWidth * 1.5,
            height: activeSupport === 'paloma' ? 140 : 50,
            background: 'radial-gradient(ellipse at center, rgba(24,36,74,0.45) 0%, transparent 70%)',
            transform: `translateY(160px) rotateX(90deg) rotateZ(${-rotY}deg)`,
          }}
        />

        {/* 3D Orbit Node */}
        <div
          className="relative transition-transform duration-75 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {activeSupport === 'paloma' && (
            <>
              {/* Top Hinges (Bisagras doradas superiores reales como la foto) */}
              <div
                className="absolute left-1/2 -top-3 -translate-x-1/2 flex justify-between px-6 z-20"
                style={{
                  width: boxWidth,
                  transform: 'translateZ(2px)',
                }}
              >
                <div className="h-4 w-7 rounded-sm bg-gradient-to-b from-[#d4af37] via-[#f7e692] to-[#aa8c2c] shadow-md border border-[#8a7223]" />
                <div className="h-4 w-7 rounded-sm bg-gradient-to-b from-[#d4af37] via-[#f7e692] to-[#aa8c2c] shadow-md border border-[#8a7223]" />
              </div>

              {/* Front Face (Cara A) */}
              <div
                className="relative rounded-t-sm shadow-xl flex flex-col justify-between"
                style={{
                  width: boxWidth,
                  height: boxHeight,
                  transformOrigin: 'top center',
                  transform: 'rotateX(-11deg) translateZ(28px)',
                  transformStyle: 'preserve-3d',
                  backgroundColor: '#18244A',
                  border: '6px solid #231F20',
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.4), inset 0 0 10px rgba(0,0,0,0.5)',
                }}
              >
                {/* Print area */}
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0" style={imgStyle} />
                  {!imageUrl && (
                    <div className="z-10 text-center text-white/80 p-4">
                      <p className="font-bold text-sm tracking-wider">TU DISEÑO AQUÍ</p>
                      <p className="text-[10px] text-white/60 mt-1">Sube una imagen para ver la maqueta</p>
                    </div>
                  )}
                  {/* Gloss sheen overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-80" />
                </div>

                {/* Wooden legs at the bottom (patas de madera visibles que tocan el suelo) */}
                <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-2 pointer-events-none">
                  <div className="w-5 h-8 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                  <div className="w-5 h-8 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                </div>
              </div>

              {/* Back Face (Cara B - Caballete trasero en A) */}
              <div
                className="absolute top-0 left-0 rounded-t-sm shadow-lg flex flex-col justify-between"
                style={{
                  width: boxWidth,
                  height: boxHeight,
                  transformOrigin: 'top center',
                  transform: 'rotateX(11deg) translateZ(-28px) rotateY(180deg)',
                  transformStyle: 'preserve-3d',
                  backgroundColor: '#1E293B',
                  border: '6px solid #231F20',
                }}
              >
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0" style={imgStyle} />
                  {/* Sheen on back */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                </div>
                {/* Back legs */}
                <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-2 pointer-events-none">
                  <div className="w-5 h-8 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                  <div className="w-5 h-8 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                </div>
              </div>

              {/* Side Limiter Chain (Cadenilla de apertura lateral visible en 3D) */}
              <div
                className="absolute top-1/2 left-0 w-14 h-[2px] bg-neutral-400 opacity-60"
                style={{
                  transform: 'translateX(-26px) translateY(30px) rotateY(90deg)',
                  boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                }}
              />
            </>
          )}

          {activeSupport === 'pvc' && (
            /* Tela PVC con ojales metálicos perimetrales */
            <div
              className="relative shadow-2xl rounded-xs border-2 border-neutral-300"
              style={{
                width: boxWidth,
                height: boxHeight,
                backgroundColor: '#ffffff',
                boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
              }}
            >
              {/* Printed banner */}
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0" style={imgStyle} />
                {!imageUrl && (
                  <div className="z-10 text-center text-white/80 p-4">
                    <p className="font-bold text-sm tracking-wider">LIENZO TELA PVC</p>
                    <p className="text-[10px] text-white/60 mt-1">Con ojales reforzados</p>
                  </div>
                )}
                {/* Vinyl texture & sheen */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/10" />
              </div>

              {/* Metal Eyelets (Ojales de latón en esquinas y centro) */}
              {[
                'top-2 left-2',
                'top-2 right-2',
                'bottom-2 left-2',
                'bottom-2 right-2',
                'top-2 left-1/2 -translate-x-1/2',
                'bottom-2 left-1/2 -translate-x-1/2',
              ].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} h-4 w-4 rounded-full border-2 border-[#caa834] bg-neutral-900 shadow-inner flex items-center justify-center`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                </div>
              ))}
            </div>
          )}

          {activeSupport === 'panel' && (
            /* Cartel Mural / Adhesivo */
            <div
              className="relative shadow-2xl rounded-lg border border-white/40"
              style={{
                width: boxWidth,
                height: boxHeight,
                backgroundColor: '#ffffff',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
              }}
            >
              <div className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center">
                <div className="absolute inset-0" style={imgStyle} />
                {!imageUrl && (
                  <div className="z-10 text-center text-white/80 p-4">
                    <p className="font-bold text-sm tracking-wider">ADHESIVO / MURAL</p>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* Dimension indicator badge */}
        <div className="absolute bottom-3 right-3 bg-[#18244A] text-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-md border border-white/20 pointer-events-none">
          {widthCm} × {heightCm} cm
        </div>

        {/* Drag Hint */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] text-[#18244A99] pointer-events-none">
          <span>↺</span> Arrastra para girar en 3D
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#18244a15]">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#667089] mr-1">Ángulo:</span>
          <button
            type="button"
            onClick={() => setView(0, 0)}
            className={`px-2 py-1 rounded border transition ${
              rotY === 0 && rotX === 0
                ? 'border-[#00A9D6] bg-[#00A9D615] font-bold text-[#00A9D6]'
                : 'border-[#18244a20] bg-white text-[#18244A] hover:bg-neutral-100'
            }`}
          >
            Frontal
          </button>
          <button
            type="button"
            onClick={() => setView(25, -10)}
            className={`px-2 py-1 rounded border transition ${
              rotY === 25 && rotX === -10
                ? 'border-[#00A9D6] bg-[#00A9D615] font-bold text-[#00A9D6]'
                : 'border-[#18244a20] bg-white text-[#18244A] hover:bg-neutral-100'
            }`}
          >
            Perspectiva
          </button>
          <button
            type="button"
            onClick={() => setView(70, -5)}
            className={`px-2 py-1 rounded border transition ${
              rotY === 70 && rotX === -5
                ? 'border-[#00A9D6] bg-[#00A9D615] font-bold text-[#00A9D6]'
                : 'border-[#18244a20] bg-white text-[#18244A] hover:bg-neutral-100'
            }`}
          >
            Perfil
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
            autoRotate
              ? 'bg-[#EF3785] text-white'
              : 'border border-[#18244a25] bg-white text-[#18244A] hover:border-[#EF3785]'
          }`}
        >
          <span>{autoRotate ? '⏸ Detener' : '▶ Auto-Giro 360°'}</span>
        </button>
      </div>
    </div>
  )
}
