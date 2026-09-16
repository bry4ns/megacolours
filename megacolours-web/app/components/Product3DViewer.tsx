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
  const [rotY, setRotY] = useState(22)
  const [rotX, setRotX] = useState(-8)
  const [autoRotate, setAutoRotate] = useState(false)
  const [showEnvironment, setShowEnvironment] = useState(true)
  const [activeSupport, setActiveSupport] = useState<'paloma' | 'poste' | 'pvc' | 'panel'>('paloma')

  useEffect(() => {
    if (productType === 'paloma') setActiveSupport('paloma')
    else if (productType === 'cartel-poste') setActiveSupport('poste')
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
      setRotY((y) => (y + delta * 18) % 360)
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
    setRotX((x) => Math.max(-25, Math.min(25, x - dy * 0.35)))
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

  // Proportions: target board height is 240px
  const ratio = widthCm && heightCm ? widthCm / heightCm : 0.45
  const boxHeight = 240
  const boxWidth = Math.min(240, Math.max(90, Math.round(boxHeight * ratio)))

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
    <div className="flex flex-col rounded-2xl border border-[#18244a22] bg-[#18244A06] p-4 sm:p-6 select-none overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#18244a15]">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#00A9D6] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-[.2em] text-[#18244A]">
            Maqueta Virtual 3D {title ? `· ${title}` : ''}
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
            onClick={() => setActiveSupport('poste')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeSupport === 'poste'
                ? 'bg-[#18244A] text-white'
                : 'text-[#667089] hover:text-[#18244A]'
            }`}
          >
            Cartel de Poste
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
            Mural / Adhesivo
          </button>
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div
        className="relative flex h-[380px] w-full items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none bg-gradient-to-b from-sky-100/40 via-[#FAFAF7] to-neutral-200/60 rounded-xl mt-3 border border-[#18244a10]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ perspective: 1100 }}
      >
        {/* Sidewalk pavement on the floor with perspective */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none opacity-40 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.06)_100%),repeating-linear-gradient(90deg,transparent_0px,transparent_40px,rgba(0,0,0,0.04)_40px,rgba(0,0,0,0.04)_41px)]"
          style={{
            transformOrigin: 'bottom center',
            transform: 'rotateX(55deg)',
          }}
        />

        {/* Tree and Human Environmental Scale Reference */}
        {showEnvironment && (
          <div
            className="absolute inset-0 pointer-events-none transition-transform duration-100 ease-out"
            style={{
              transform: `translateZ(-90px) rotateY(${rotY * 0.15}deg)`,
            }}
          >
            {/* Tree on the left (~3.5m tall real scale) */}
            <div className="absolute left-[8%] sm:left-[12%] bottom-10 flex flex-col items-center opacity-85">
              {/* Foliage Canopy */}
              <div className="relative flex flex-col items-center">
                <div className="h-24 w-28 sm:h-28 sm:w-32 rounded-full bg-gradient-to-t from-emerald-700 via-emerald-600 to-green-500 shadow-md border border-emerald-800/30" />
                <div className="absolute -top-3 h-16 w-20 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-90" />
                <div className="absolute top-4 -right-2 h-14 w-14 rounded-full bg-emerald-700/80" />
              </div>
              {/* Trunk */}
              <div className="w-4 h-24 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-b-xs shadow-inner" />
              <span className="mt-1 text-[10px] font-bold text-neutral-600 bg-white/80 px-2 py-0.5 rounded-full border border-neutral-300">
                🌳 Árbol ~3.5m
              </span>
            </div>

            {/* Person silhouette on the right (~1.75m tall) */}
            <div className="absolute right-[10%] sm:right-[15%] bottom-10 flex flex-col items-center opacity-70">
              {/* Head */}
              <div className="h-5 w-5 rounded-full bg-neutral-600 mb-0.5 shadow-xs" />
              {/* Body */}
              <div className="w-8 h-20 bg-neutral-600 rounded-t-lg rounded-b-sm" />
              {/* Legs */}
              <div className="flex gap-1.5 mt-0.5">
                <div className="w-2.5 h-16 bg-neutral-700 rounded-b-xs" />
                <div className="w-2.5 h-16 bg-neutral-700 rounded-b-xs" />
              </div>
              <span className="mt-1 text-[10px] font-bold text-neutral-600 bg-white/80 px-2 py-0.5 rounded-full border border-neutral-300">
                👤 Persona ~1.75m
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Ground Shadow Plane */}
        <div
          className="absolute pointer-events-none rounded-full blur-md opacity-50 transition-transform duration-75"
          style={{
            width: boxWidth * 1.6,
            height: activeSupport === 'paloma' ? 120 : 50,
            background: 'radial-gradient(ellipse at center, rgba(24,36,74,0.6) 0%, transparent 70%)',
            transform: `translateY(145px) rotateX(90deg) rotateZ(${-rotY}deg)`,
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
          {/* ================= 1. PALOMA CABALLETE EN A (GEOMETRÍA PERFECTA) ================= */}
          {activeSupport === 'paloma' && (
            <div
              className="relative"
              style={{
                width: boxWidth,
                height: boxHeight,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Top Hinge Bar at the Apex Line (z=0, y=0) */}
              <div
                className="absolute left-0 right-0 -top-2 flex justify-between px-5 z-30 pointer-events-none"
                style={{
                  transform: 'translateZ(1px)',
                }}
              >
                <div className="h-3.5 w-6 rounded-sm bg-gradient-to-b from-[#e5c158] via-[#ffd977] to-[#997722] shadow-md border border-[#7a5d16]" />
                <div className="h-3.5 w-6 rounded-sm bg-gradient-to-b from-[#e5c158] via-[#ffd977] to-[#997722] shadow-md border border-[#7a5d16]" />
              </div>

              {/* Front Face (Cara A): Inclinada hacia adelante desde la cúspide */}
              <div
                className="absolute inset-0 rounded-t-xs shadow-xl flex flex-col justify-between"
                style={{
                  transformOrigin: 'top center',
                  transform: 'rotateX(-12.5deg) translateZ(1px)',
                  transformStyle: 'preserve-3d',
                  backgroundColor: '#18244A',
                  border: '5px solid #231F20',
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.5)',
                }}
              >
                {/* Print area */}
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0" style={imgStyle} />
                  {!imageUrl && (
                    <div className="z-10 text-center text-white/80 p-4">
                      <p className="font-bold text-xs tracking-wider">PALOMA PUBLICITARIA</p>
                      <p className="text-[10px] text-white/60 mt-1">Sube tu diseño para ver la maqueta</p>
                    </div>
                  )}
                  {/* Gloss sheen overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                </div>

                {/* Wooden legs at bottom touching floor */}
                <div className="absolute -bottom-7 left-0 right-0 flex justify-between px-2 pointer-events-none">
                  <div className="w-4 h-7 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                  <div className="w-4 h-7 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                </div>
              </div>

              {/* Back Face (Cara B): Inclinada hacia atrás desde la misma cúspide */}
              <div
                className="absolute inset-0 rounded-t-xs shadow-xl flex flex-col justify-between"
                style={{
                  transformOrigin: 'top center',
                  transform: 'rotateY(180deg) rotateX(-12.5deg) translateZ(1px)',
                  transformStyle: 'preserve-3d',
                  backgroundColor: '#1E293B',
                  border: '5px solid #231F20',
                  boxShadow: '0 20px 30px -10px rgba(0,0,0,0.5)',
                }}
              >
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0" style={imgStyle} />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                </div>
                {/* Back legs */}
                <div className="absolute -bottom-7 left-0 right-0 flex justify-between px-2 pointer-events-none">
                  <div className="w-4 h-7 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                  <div className="w-4 h-7 bg-gradient-to-r from-[#8B5A2B] via-[#CD853F] to-[#8B5A2B] border border-[#5c3a1e] rounded-b-xs shadow-sm" />
                </div>
              </div>

              {/* Opening Limiter Chain (Cadenilla lateral visible a media altura) */}
              <div
                className="absolute top-[60%] left-1 w-12 h-[2px] bg-neutral-300 opacity-70 pointer-events-none"
                style={{
                  transform: 'translateX(-22px) rotateY(90deg)',
                  boxShadow: '0 0 3px rgba(0,0,0,0.6)',
                }}
              />
            </div>
          )}

          {/* ================= 2. CARTEL PARA POSTE (CON ABRAZADERAS Y POSTE) ================= */}
          {activeSupport === 'poste' && (
            <div
              className="relative flex items-center justify-center"
              style={{
                width: boxWidth + 80,
                height: 310,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Vertical Street Pole (Poste de alumbrado cilíndrico) */}
              <div
                className="absolute left-4 top-0 bottom-0 w-8 rounded-full bg-gradient-to-r from-neutral-500 via-neutral-200 to-neutral-600 shadow-xl border border-neutral-400"
                style={{
                  transform: 'translateZ(-10px)',
                }}
              >
                {/* Pole concrete texture lines */}
                <div className="absolute top-12 left-0 right-0 h-[1px] bg-neutral-400/80" />
                <div className="absolute top-28 left-0 right-0 h-[1px] bg-neutral-400/80" />
                <div className="absolute bottom-16 left-0 right-0 h-[1px] bg-neutral-400/80" />
              </div>

              {/* Upper Mounting Bracket / Collarín de Poste */}
              <div
                className="absolute left-3 top-16 w-11 h-4 rounded-full border-2 border-neutral-800 bg-gradient-to-r from-neutral-400 via-neutral-100 to-neutral-400 shadow-md z-20 flex items-center justify-end pr-1"
                style={{ transform: 'translateZ(1px)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
              </div>
              {/* Upper Horizontal Arm */}
              <div
                className="absolute left-10 top-[70px] h-2.5 bg-neutral-700 shadow-sm z-10"
                style={{ width: boxWidth + 8 }}
              />

              {/* Lower Mounting Bracket */}
              <div
                className="absolute left-3 bottom-16 w-11 h-4 rounded-full border-2 border-neutral-800 bg-gradient-to-r from-neutral-400 via-neutral-100 to-neutral-400 shadow-md z-20 flex items-center justify-end pr-1"
                style={{ transform: 'translateZ(1px)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
              </div>
              {/* Lower Horizontal Arm */}
              <div
                className="absolute left-10 bottom-[70px] h-2.5 bg-neutral-700 shadow-sm z-10"
                style={{ width: boxWidth + 8 }}
              />

              {/* The Printed Post Sign Board */}
              <div
                className="absolute left-14 top-16 shadow-2xl rounded-sm border-4 border-neutral-800 flex items-center justify-center overflow-hidden"
                style={{
                  width: boxWidth,
                  height: boxHeight - 20,
                  transform: 'translateZ(6px)',
                  backgroundColor: '#ffffff',
                }}
              >
                <div className="absolute inset-0" style={imgStyle} />
                {!imageUrl && (
                  <div className="z-10 text-center text-neutral-800 p-3">
                    <p className="font-bold text-xs tracking-wider">CARTEL PARA POSTE</p>
                    <p className="text-[9px] text-neutral-600 mt-1">Con fijación de abrazadera</p>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-black/10" />
              </div>
            </div>
          )}

          {/* ================= 3. LONA TELA PVC CON OJALES ================= */}
          {activeSupport === 'pvc' && (
            <div
              className="relative shadow-2xl rounded-xs border-2 border-neutral-300"
              style={{
                width: boxWidth,
                height: boxHeight,
                backgroundColor: '#ffffff',
                boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
              }}
            >
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0" style={imgStyle} />
                {!imageUrl && (
                  <div className="z-10 text-center text-white/80 p-4">
                    <p className="font-bold text-xs tracking-wider">LIENZO TELA PVC</p>
                    <p className="text-[10px] text-white/60 mt-1">Con ojales reforzados</p>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 via-transparent to-black/10" />
              </div>

              {/* Eyelets */}
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
                  className={`absolute ${pos} h-3.5 w-3.5 rounded-full border-2 border-[#caa834] bg-neutral-900 shadow-inner flex items-center justify-center`}
                >
                  <div className="h-1 w-1 rounded-full bg-white/40" />
                </div>
              ))}
            </div>
          )}

          {/* ================= 4. CARTEL MURAL / ADHESIVO ================= */}
          {activeSupport === 'panel' && (
            <div
              className="relative shadow-2xl rounded-lg border border-white/40"
              style={{
                width: boxWidth,
                height: boxHeight,
                backgroundColor: '#ffffff',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.35)',
              }}
            >
              <div className="relative w-full h-full overflow-hidden rounded-lg flex items-center justify-center">
                <div className="absolute inset-0" style={imgStyle} />
                {!imageUrl && (
                  <div className="z-10 text-center text-white/80 p-4">
                    <p className="font-bold text-xs tracking-wider">ADHESIVO / MURAL</p>
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
          <span>↺</span> Arrastra para rotar en 3D
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
            onClick={() => setView(22, -8)}
            className={`px-2 py-1 rounded border transition ${
              rotY === 22 && rotX === -8
                ? 'border-[#00A9D6] bg-[#00A9D615] font-bold text-[#00A9D6]'
                : 'border-[#18244a20] bg-white text-[#18244A] hover:bg-neutral-100'
            }`}
          >
            Perspectiva 3D
          </button>
          <button
            type="button"
            onClick={() => setView(75, -4)}
            className={`px-2 py-1 rounded border transition ${
              rotY === 75 && rotX === -4
                ? 'border-[#00A9D6] bg-[#00A9D615] font-bold text-[#00A9D6]'
                : 'border-[#18244a20] bg-white text-[#18244A] hover:bg-neutral-100'
            }`}
          >
            Perfil
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Environment Scale Toggle */}
          <button
            type="button"
            onClick={() => setShowEnvironment(!showEnvironment)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
              showEnvironment
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-white border-neutral-300 text-neutral-600'
            }`}
          >
            <span>{showEnvironment ? '🌳 Con escala real' : '🏢 Sin entorno'}</span>
          </button>

          {/* Auto rotate */}
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
    </div>
  )
}
