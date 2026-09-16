'use client'
import React, { useState, useRef, useEffect } from 'react'

export interface CropState {
  x: number // 0 to 1 focal center
  y: number // 0 to 1 focal center
  zoom: number // 1 to 4
  rotation: 0
}

interface ImageCropperProps {
  imageUrl: string
  originalWidth: number
  originalHeight: number
  crop: CropState
  onChange: (newCrop: CropState, effectivePx: { width: number; height: number }) => void
  targetAspectRatio?: number
  onClose?: () => void
}

export function ImageCropper({
  imageUrl,
  originalWidth,
  originalHeight,
  crop,
  onChange,
  targetAspectRatio,
  onClose,
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(crop.zoom || 1)
  const [focalX, setFocalX] = useState(crop.x || 0.5)
  const [focalY, setFocalY] = useState(crop.y || 0.5)
  const [aspect, setAspect] = useState<number | null>(targetAspectRatio || null)

  const dragging = useRef(false)
  const lastCoord = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Update parent when crop changes
  useEffect(() => {
    const effW = Math.round(originalWidth / zoom)
    const effH = Math.round(originalHeight / zoom)
    onChange(
      { x: focalX, y: focalY, zoom, rotation: 0 },
      { width: effW, height: effH }
    )
  }, [zoom, focalX, focalY, originalWidth, originalHeight, onChange])

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    lastCoord.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = (e.clientX - lastCoord.current.x) / (rect.width * zoom)
    const dy = (e.clientY - lastCoord.current.y) / (rect.height * zoom)
    lastCoord.current = { x: e.clientX, y: e.clientY }

    // Inverse pan direction to feel like moving the image
    setFocalX((x) => Math.max(0, Math.min(1, x - dx)))
    setFocalY((y) => Math.max(0, Math.min(1, y - dy)))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const resetCrop = () => {
    setZoom(1)
    setFocalX(0.5)
    setFocalY(0.5)
    setAspect(null)
  }

  // Calculate box aspect ratio style
  const containerAspect = aspect || (originalWidth && originalHeight ? originalWidth / originalHeight : 1)

  return (
    <div className="rounded-2xl border-2 border-[#18244A] bg-[#FAFAF7] p-5 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#18244a20]">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#18244A]">
            Encuadre y Recorte de Imagen
          </h4>
          <p className="text-xs text-[#667089]">
            Arrastra sobre la imagen para encuadrar y ajusta el zoom
          </p>
        </div>
        <button
          type="button"
          onClick={resetCrop}
          className="text-xs text-[#667089] hover:text-[#EF3785] underline font-medium"
        >
          Restablecer
        </button>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold text-[#18244A] mr-1">Proporción:</span>
        <button
          type="button"
          onClick={() => setAspect(null)}
          className={`px-2.5 py-1 text-xs rounded-full border transition ${
            aspect === null
              ? 'border-[#EF3785] bg-[#EF378514] font-bold text-[#EF3785]'
              : 'border-[#18244a20] bg-white text-[#667089] hover:border-[#18244A]'
          }`}
        >
          Original ({originalWidth} × {originalHeight} px)
        </button>
        <button
          type="button"
          onClick={() => setAspect(1)}
          className={`px-2.5 py-1 text-xs rounded-full border transition ${
            aspect === 1
              ? 'border-[#EF3785] bg-[#EF378514] font-bold text-[#EF3785]'
              : 'border-[#18244a20] bg-white text-[#667089] hover:border-[#18244A]'
          }`}
        >
          1:1 Cuadrado
        </button>
        <button
          type="button"
          onClick={() => setAspect(4 / 3)}
          className={`px-2.5 py-1 text-xs rounded-full border transition ${
            aspect === 4 / 3
              ? 'border-[#EF3785] bg-[#EF378514] font-bold text-[#EF3785]'
              : 'border-[#18244a20] bg-white text-[#667089] hover:border-[#18244A]'
          }`}
        >
          4:3 Apaisado
        </button>
        <button
          type="button"
          onClick={() => setAspect(80 / 180)}
          className={`px-2.5 py-1 text-xs rounded-full border transition ${
            aspect === 80 / 180
              ? 'border-[#EF3785] bg-[#EF378514] font-bold text-[#EF3785]'
              : 'border-[#18244a20] bg-white text-[#667089] hover:border-[#18244A]'
          }`}
        >
          Paloma (80 × 180 cm)
        </button>
      </div>

      {/* Interactive Crop Area */}
      <div className="mt-4 flex justify-center bg-[#18244A08] p-3 rounded-xl overflow-hidden">
        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative max-w-full max-h-[300px] h-[260px] cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border-2 border-dashed border-[#18244A] shadow-inner select-none touch-none"
          style={{
            aspectRatio: `${containerAspect}`,
          }}
        >
          {/* Cropped Image Element */}
          <div
            className="absolute inset-0 transition-[background-size] duration-75"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${zoom * 100}%`,
              backgroundPosition: `${focalX * 100}% ${focalY * 100}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />

          {/* Rule of Thirds Grid Overlay */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/30">
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-white/25" />
            <div className="border-r border-white/25" />
            <div />
          </div>

          {/* Focal center mark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
            <div className="w-3 h-3 rounded-full border border-white" />
          </div>
        </div>
      </div>

      {/* Zoom and Sliders */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#18244A] w-14">Zoom</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(1)))}
            className="h-7 w-7 rounded border border-[#18244a30] bg-white font-bold text-xs hover:bg-neutral-100"
          >
            -
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
            className="flex-1 accent-[#EF3785]"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))}
            className="h-7 w-7 rounded border border-[#18244a30] bg-white font-bold text-xs hover:bg-neutral-100"
          >
            +
          </button>
          <span className="text-xs font-mono font-bold text-[#18244A] w-10 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-[#667089] pt-1">
          <span>
            Píxeles útiles:{' '}
            <strong className="text-[#18244A]">
              {Math.round(originalWidth / zoom)} × {Math.round(originalHeight / zoom)} px
            </strong>
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#18244A] px-4 py-1.5 font-bold text-white transition hover:bg-[#00A9D6]"
            >
              Listo / Guardar encuadre ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
