'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [showEnvironment, setShowEnvironment] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [activeSupport, setActiveSupport] = useState<'paloma' | 'poste' | 'pvc' | 'panel'>('paloma')
  const [activePresetView, setActivePresetView] = useState<'persp' | 'front' | 'side'>('persp')

  // Sync active support when productType prop changes
  useEffect(() => {
    if (productType === 'paloma') setActiveSupport('paloma')
    else if (productType === 'cartel-poste') setActiveSupport('poste')
    else if (productType === 'pvc') setActiveSupport('pvc')
    else setActiveSupport('panel')
  }, [productType])

  // Camera Orbit state (refs for smooth 60fps animation loop)
  const azimuthRef = useRef(0.45) // ~26 degrees
  const elevationRef = useRef(0.18) // ~10 degrees
  const distanceRef = useRef(3.8) // meters
  const targetLookAtRef = useRef(new THREE.Vector3(0, 1.05, 0))
  const isDraggingRef = useRef(false)
  const pointerPosRef = useRef({ x: 0, y: 0 })
  const autoRotateRef = useRef(autoRotate)
  autoRotateRef.current = autoRotate

  // Three.js object references for dynamic updates
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const envGroupRef = useRef<THREE.Group | null>(null)
  const signGroupRef = useRef<THREE.Group | null>(null)
  const canvasTexRef = useRef<THREE.CanvasTexture | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // -------------------------------------------------------------
  // Dynamic Texture Generation (Offscreen Canvas -> THREE.CanvasTexture)
  // -------------------------------------------------------------
  const renderTextureToCanvas = useCallback(() => {
    if (!offscreenCanvasRef.current || !canvasTexRef.current) return
    const canvas = offscreenCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    if (imageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.fillStyle = '#18244A'
        ctx.fillRect(0, 0, W, H)

        // Apply user crop & zoom
        const zoom = Math.max(0.2, crop.zoom || 1)
        const cx = crop.x ?? 0.5
        const cy = crop.y ?? 0.5

        const srcW = img.naturalWidth / zoom
        const srcH = img.naturalHeight / zoom
        const srcX = cx * img.naturalWidth - srcW / 2
        const srcY = cy * img.naturalHeight - srcH / 2

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, W, H)
        if (canvasTexRef.current) {
          canvasTexRef.current.needsUpdate = true
        }
      }
      img.src = imageUrl
    } else {
      // Modern MegaColours Branded Placeholder Graphic
      const grad = ctx.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0, '#121B38')
      grad.addColorStop(0.5, '#18244A')
      grad.addColorStop(1, '#253565')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // Accent color lines
      ctx.fillStyle = '#00A9D6'
      ctx.fillRect(40, 40, W - 80, 8)
      ctx.fillStyle = '#EF3785'
      ctx.fillRect(40, H - 48, W - 80, 8)

      // Corner geometric accents
      ctx.strokeStyle = '#FFFFFF15'
      ctx.lineWidth = 2
      ctx.strokeRect(40, 40, W - 80, H - 80)

      // Text Branding
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      ctx.fillStyle = '#00A9D6'
      ctx.font = 'bold 36px sans-serif'
      ctx.fillText('MEGACOLOURS', W / 2, H / 2 - 80)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText('IMPRESIÓN DIGITAL EN ALTA CALIDAD', W / 2, H / 2 - 35)

      // Dimension pill
      ctx.fillStyle = '#FFFFFF18'
      const pillW = 280
      const pillH = 46
      ctx.beginPath()
      ctx.roundRect(W / 2 - pillW / 2, H / 2 + 10, pillW, pillH, 23)
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF35'
      ctx.stroke()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 20px monospace'
      ctx.fillText(`${widthCm} × ${heightCm} cm`, W / 2, H / 2 + 33)

      ctx.fillStyle = '#94A3B8'
      ctx.font = '16px sans-serif'
      ctx.fillText('Sube tu imagen para previsualizar aquí', W / 2, H / 2 + 90)

      canvasTexRef.current.needsUpdate = true
    }
  }, [imageUrl, crop.x, crop.y, crop.zoom, widthCm, heightCm])

  // Update texture whenever image or crop changes
  useEffect(() => {
    renderTextureToCanvas()
  }, [renderTextureToCanvas])

  // Toggle environment visibility
  useEffect(() => {
    if (envGroupRef.current) {
      envGroupRef.current.visible = showEnvironment
    }
  }, [showEnvironment])

  // -------------------------------------------------------------
  // Rebuild 3D Model when activeSupport, widthCm, or heightCm changes
  // -------------------------------------------------------------
  useEffect(() => {
    const signGroup = signGroupRef.current
    if (!signGroup || !canvasTexRef.current) return

    // Clear previous models
    while (signGroup.children.length > 0) {
      const obj = signGroup.children[0]
      signGroup.remove(obj)
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose()
    }

    const wMeters = Math.max(0.2, (widthCm || 80) / 100)
    const hMeters = Math.max(0.2, (heightCm || 180) / 100)
    const texture = canvasTexRef.current

    // Common Materials
    const printFrontMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.05,
    })

    const printBackMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.35,
      metalness: 0.05,
    })

    const darkAluminumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.7,
    })

    const brassHingeMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85,
    })

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.8,
    })

    const rubberFootMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    })

    // =========================================================================
    // 1. PALOMA CABALLETE (True A-Frame Geometry: Touching at top apex, NO 'X')
    // =========================================================================
    if (activeSupport === 'paloma') {
      const legExtra = 0.14 // 14 cm foot extension below print
      const totalBoardLen = hMeters + legExtra
      const halfAngle = 0.19 // ~11 degrees slant each way
      const apexY = totalBoardLen * Math.cos(halfAngle)
      const frameThick = 0.032
      const profileW = 0.035

      targetLookAtRef.current.set(0, apexY * 0.55, 0)

      // Top Hinge Axis Cylinder at the apex
      const hingeAxisGeom = new THREE.CylinderGeometry(0.016, 0.016, wMeters + 0.02, 16)
      hingeAxisGeom.rotateZ(Math.PI / 2)
      const hingeAxisMesh = new THREE.Mesh(hingeAxisGeom, brassHingeMat)
      hingeAxisMesh.position.set(0, apexY, 0)
      hingeAxisMesh.castShadow = true
      signGroup.add(hingeAxisMesh)

      // Decorative hinge caps
      for (const offset of [-wMeters * 0.35, wMeters * 0.35]) {
        const capGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.04, 16)
        capGeom.rotateZ(Math.PI / 2)
        const capMesh = new THREE.Mesh(capGeom, brassHingeMat)
        capMesh.position.set(offset, apexY, 0)
        signGroup.add(capMesh)
      }

      // Builder for one board side pivoting from apex
      const createBoard = (angleSign: number, isFront: boolean) => {
        const pivot = new THREE.Group()
        pivot.position.set(0, apexY, 0)
        pivot.rotation.x = angleSign * halfAngle

        const boardSubGroup = new THREE.Group()
        // Shift board down along its angled local Y-axis
        boardSubGroup.position.set(0, -totalBoardLen / 2, 0)

        // Outer Structural Frame (Top, Bottom, Left, Right struts)
        // Left Leg
        const leftLegGeom = new THREE.BoxGeometry(profileW, totalBoardLen, frameThick)
        const leftLeg = new THREE.Mesh(leftLegGeom, darkAluminumMat)
        leftLeg.position.set(-wMeters / 2 + profileW / 2, 0, 0)
        leftLeg.castShadow = true
        boardSubGroup.add(leftLeg)

        // Right Leg
        const rightLegGeom = new THREE.BoxGeometry(profileW, totalBoardLen, frameThick)
        const rightLeg = new THREE.Mesh(rightLegGeom, darkAluminumMat)
        rightLeg.position.set(wMeters / 2 - profileW / 2, 0, 0)
        rightLeg.castShadow = true
        boardSubGroup.add(rightLeg)

        // Top Frame Rail
        const topRailGeom = new THREE.BoxGeometry(wMeters - profileW * 2, profileW, frameThick)
        const topRail = new THREE.Mesh(topRailGeom, darkAluminumMat)
        topRail.position.set(0, totalBoardLen / 2 - profileW / 2, 0)
        boardSubGroup.add(topRail)

        // Mid/Bottom Frame Rail (above feet)
        const midRailGeom = new THREE.BoxGeometry(wMeters - profileW * 2, profileW, frameThick)
        const midRail = new THREE.Mesh(midRailGeom, darkAluminumMat)
        midRail.position.set(0, -totalBoardLen / 2 + legExtra + profileW / 2, 0)
        boardSubGroup.add(midRail)

        // Printed Panel (Facing outwards)
        const panelW = wMeters - profileW * 2
        const panelH = hMeters - profileW
        const panelGeom = new THREE.BoxGeometry(panelW, panelH, 0.008)

        // Panel materials: outer face has texture, others dark aluminum
        const mat = isFront ? printFrontMat : printBackMat
        const panelMaterials = [
          darkAluminumMat,
          darkAluminumMat,
          darkAluminumMat,
          darkAluminumMat,
          angleSign < 0 ? mat : darkAluminumMat, // +Z face
          angleSign > 0 ? mat : darkAluminumMat, // -Z face
        ]
        const panelMesh = new THREE.Mesh(panelGeom, panelMaterials)
        panelMesh.position.set(0, legExtra / 2, angleSign < 0 ? frameThick * 0.35 : -frameThick * 0.35)
        panelMesh.castShadow = true
        boardSubGroup.add(panelMesh)

        // Rubber Foot Pads at bottom
        for (const legX of [-wMeters / 2 + profileW / 2, wMeters / 2 - profileW / 2]) {
          const footGeom = new THREE.BoxGeometry(profileW * 1.2, 0.02, frameThick * 1.3)
          const footMesh = new THREE.Mesh(footGeom, rubberFootMat)
          footMesh.position.set(legX, -totalBoardLen / 2 + 0.01, 0)
          boardSubGroup.add(footMesh)
        }

        pivot.add(boardSubGroup)
        return pivot
      }

      // Front Face ( Cara A ) - angled slightly forward
      signGroup.add(createBoard(-1, true))
      // Back Face ( Cara B ) - angled slightly backward
      signGroup.add(createBoard(1, false))

      // Bottom Safety Spreader Bars (Chicotes/Cadenas de sujeción)
      const spreaderY = 0.28
      const spreaderZSpan = (apexY - spreaderY) * Math.tan(halfAngle) * 2
      for (const spreaderX of [-wMeters * 0.4, wMeters * 0.4]) {
        const spreaderGeom = new THREE.CylinderGeometry(0.004, 0.004, spreaderZSpan, 8)
        spreaderGeom.rotateX(Math.PI / 2)
        const spreaderMesh = new THREE.Mesh(spreaderGeom, steelMat)
        spreaderMesh.position.set(spreaderX, spreaderY, 0)
        signGroup.add(spreaderMesh)
      }
    }

    // =========================================================================
    // 2. CARTEL PARA POSTE (Urban Post Mount with Steel Clamp Rings & Arms)
    // =========================================================================
    else if (activeSupport === 'poste') {
      const poleHeight = 4.2
      const poleRadius = 0.08
      const poleX = -(wMeters / 2 + 0.18)
      const signCenterY = 2.2 // Mount at ~2.2m above sidewalk
      targetLookAtRef.current.set(0, signCenterY, 0)

      // Concrete / Steel Street Pole
      const poleGeom = new THREE.CylinderGeometry(poleRadius * 0.9, poleRadius, poleHeight, 24)
      const poleMesh = new THREE.Mesh(poleGeom, steelMat)
      poleMesh.position.set(poleX, poleHeight / 2, 0)
      poleMesh.castShadow = true
      poleMesh.receiveShadow = true
      signGroup.add(poleMesh)

      // Post Concrete Base Footing
      const baseGeom = new THREE.CylinderGeometry(poleRadius * 2, poleRadius * 2.2, 0.25, 24)
      const concreteBaseMat = new THREE.MeshStandardMaterial({
        color: 0x9ca3af,
        roughness: 0.9,
      })
      const baseMesh = new THREE.Mesh(baseGeom, concreteBaseMat)
      baseMesh.position.set(poleX, 0.125, 0)
      baseMesh.receiveShadow = true
      signGroup.add(baseMesh)

      // Mounting Clamps (Collarines/Abrazaderas) & Horizontal Cantilever Arms
      const armYs = [signCenterY + hMeters * 0.38, signCenterY - hMeters * 0.38]
      for (const armY of armYs) {
        // Clamp ring encircling pole
        const clampGeom = new THREE.TorusGeometry(poleRadius + 0.012, 0.018, 12, 32)
        clampGeom.rotateX(Math.PI / 2)
        const clampMesh = new THREE.Mesh(clampGeom, darkAluminumMat)
        clampMesh.position.set(poleX, armY, 0)
        signGroup.add(clampMesh)

        // Horizontal steel arm connecting clamp to sign frame
        const armLength = Math.abs(poleX) + wMeters / 2 + 0.03
        const armGeom = new THREE.CylinderGeometry(0.02, 0.02, armLength, 16)
        armGeom.rotateZ(Math.PI / 2)
        const armMesh = new THREE.Mesh(armGeom, steelMat)
        armMesh.position.set(poleX + armLength / 2, armY, 0)
        armMesh.castShadow = true
        signGroup.add(armMesh)
      }

      // The Double-Sided Sign Board
      const boardGroup = new THREE.Group()
      boardGroup.position.set(0, signCenterY, 0)

      // Aluminum border frame
      const frameGeom = new THREE.BoxGeometry(wMeters + 0.04, hMeters + 0.04, 0.04)
      const frameMesh = new THREE.Mesh(frameGeom, darkAluminumMat)
      frameMesh.castShadow = true
      boardGroup.add(frameMesh)

      // Front Printed Surface
      const frontPanelGeom = new THREE.PlaneGeometry(wMeters, hMeters)
      const frontPanel = new THREE.Mesh(frontPanelGeom, printFrontMat)
      frontPanel.position.set(0, 0, 0.021)
      boardGroup.add(frontPanel)

      // Back Printed Surface
      const backPanelGeom = new THREE.PlaneGeometry(wMeters, hMeters)
      backPanelGeom.rotateY(Math.PI)
      const backPanel = new THREE.Mesh(backPanelGeom, printBackMat)
      backPanel.position.set(0, 0, -0.021)
      boardGroup.add(backPanel)

      signGroup.add(boardGroup)
    }

    // =========================================================================
    // 3. LIENZO PVC CON OJALES (Reinforced Vinyl Banner with Corner Ties)
    // =========================================================================
    else if (activeSupport === 'pvc') {
      const bannerCenterY = hMeters / 2 + 0.6
      targetLookAtRef.current.set(0, bannerCenterY, 0)

      const bannerGroup = new THREE.Group()
      bannerGroup.position.set(0, bannerCenterY, 0)

      // Main Vinyl Sheet
      const bannerGeom = new THREE.BoxGeometry(wMeters, hMeters, 0.006)
      const bannerMaterials = [
        steelMat,
        steelMat,
        steelMat,
        steelMat,
        printFrontMat,
        printBackMat,
      ]
      const bannerMesh = new THREE.Mesh(bannerGeom, bannerMaterials)
      bannerMesh.castShadow = true
      bannerGroup.add(bannerMesh)

      // Brass Eyelets (Ojales metálicos) around perimeter
      const eyeletRadius = 0.016
      const eyeletGeom = new THREE.TorusGeometry(eyeletRadius, 0.005, 8, 20)
      const eyeletOffsets = [
        [-wMeters / 2 + 0.04, hMeters / 2 - 0.04],
        [wMeters / 2 - 0.04, hMeters / 2 - 0.04],
        [-wMeters / 2 + 0.04, -hMeters / 2 + 0.04],
        [wMeters / 2 - 0.04, -hMeters / 2 + 0.04],
        [0, hMeters / 2 - 0.04],
        [0, -hMeters / 2 + 0.04],
      ]
      eyeletOffsets.forEach(([ox, oy]) => {
        const eyeletMesh = new THREE.Mesh(eyeletGeom, brassHingeMat)
        eyeletMesh.position.set(ox, oy, 0.004)
        bannerGroup.add(eyeletMesh)
      })

      // Hanging Suspension Ropes/Cables
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
      for (const [ox, oy] of [
        [-wMeters / 2 + 0.04, hMeters / 2 - 0.04],
        [wMeters / 2 - 0.04, hMeters / 2 - 0.04],
      ]) {
        const ropeLength = 0.6
        const ropeGeom = new THREE.CylinderGeometry(0.004, 0.004, ropeLength, 8)
        const ropeMesh = new THREE.Mesh(ropeGeom, ropeMat)
        ropeMesh.position.set(ox * 1.15, oy + ropeLength / 2, 0)
        ropeMesh.rotation.z = ox < 0 ? -0.2 : 0.2
        bannerGroup.add(ropeMesh)
      }

      signGroup.add(bannerGroup)
    }

    // =========================================================================
    // 4. PANEL MURAL / ADHESIVO (Wall Mounted Architectural Panel)
    // =========================================================================
    else {
      const panelCenterY = hMeters / 2 + 0.5
      targetLookAtRef.current.set(0, panelCenterY, 0)

      const wallGroup = new THREE.Group()
      wallGroup.position.set(0, panelCenterY, 0)

      // Backdrop Wall Segment
      const wallW = Math.max(wMeters + 1.2, 2.4)
      const wallH = Math.max(hMeters + 1.0, 2.6)
      const wallGeom = new THREE.BoxGeometry(wallW, wallH, 0.08)
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.85,
        metalness: 0.05,
      })
      const wallMesh = new THREE.Mesh(wallGeom, wallMat)
      wallMesh.position.set(0, 0, -0.045)
      wallMesh.receiveShadow = true
      wallGroup.add(wallMesh)

      // Vinyl / Rigid Board Mounted to Wall
      const boardGeom = new THREE.BoxGeometry(wMeters, hMeters, 0.01)
      const boardMaterials = [
        darkAluminumMat,
        darkAluminumMat,
        darkAluminumMat,
        darkAluminumMat,
        printFrontMat,
        darkAluminumMat,
      ]
      const boardMesh = new THREE.Mesh(boardGeom, boardMaterials)
      boardMesh.position.set(0, 0, 0.006)
      boardMesh.castShadow = true
      wallGroup.add(boardMesh)

      signGroup.add(wallGroup)
    }
  }, [activeSupport, widthCm, heightCm])

  // -------------------------------------------------------------
  // Initial Scene Setup, WebGL Renderer, Environment & Animation Loop
  // -------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 420

    // 1. Offscreen Canvas for dynamic texture
    const offCanvas = document.createElement('canvas')
    offCanvas.width = 1024
    offCanvas.height = 1024
    offscreenCanvasRef.current = offCanvas

    const canvasTexture = new THREE.CanvasTexture(offCanvas)
    canvasTexture.colorSpace = THREE.SRGBColorSpace
    canvasTexRef.current = canvasTexture

    // 2. Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = null // Transparent background matching Tailwind container

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50)
    cameraRef.current = camera

    // 4. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer

    container.appendChild(renderer.domElement)

    // 5. Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdde3ea, 1.25)
    scene.add(hemiLight)

    // Main Sunlight (Casting Shadows)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.2)
    sunLight.position.set(3.5, 7.5, 4.5)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 20
    sunLight.shadow.camera.left = -4
    sunLight.shadow.camera.right = 4
    sunLight.shadow.camera.top = 4
    sunLight.shadow.camera.bottom = -1
    sunLight.shadow.bias = -0.0004
    scene.add(sunLight)

    // Secondary Fill Light (Soft sky reflections)
    const fillLight = new THREE.DirectionalLight(0xb0cce8, 0.75)
    fillLight.position.set(-4, 4, -3)
    scene.add(fillLight)

    // 6. Ground Plane (Sidewalk Pavement)
    const groundGeom = new THREE.CylinderGeometry(4.8, 4.8, 0.1, 48)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe8e7e3,
      roughness: 0.95,
      metalness: 0.05,
    })
    const groundMesh = new THREE.Mesh(groundGeom, groundMat)
    groundMesh.position.set(0, -0.05, 0)
    groundMesh.receiveShadow = true
    scene.add(groundMesh)

    // Sidewalk Grid Pattern Lines
    const gridHelper = new THREE.GridHelper(8, 16, 0xc4c3bd, 0xd6d5d0)
    gridHelper.position.set(0, 0.002, 0)
    scene.add(gridHelper)

    // 7. Environment Group (Tree & Human Figure for Real Scale Reference)
    const envGroup = new THREE.Group()
    envGroupRef.current = envGroup
    scene.add(envGroup)

    // -------------------------------------------------------------
    // Tree (~3.5m tall real scale) at X = -2.2m
    // -------------------------------------------------------------
    const treeGroup = new THREE.Group()
    treeGroup.position.set(-2.2, 0, -0.3)

    // Tree planter ring at base
    const planterGeom = new THREE.CylinderGeometry(0.55, 0.6, 0.08, 24)
    const planterMat = new THREE.MeshStandardMaterial({ color: 0xb5b4ae, roughness: 0.9 })
    const planterMesh = new THREE.Mesh(planterGeom, planterMat)
    planterMesh.position.set(0, 0.04, 0)
    planterMesh.receiveShadow = true
    treeGroup.add(planterMesh)

    // Mulch soil inside planter
    const soilGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.02, 24)
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 1.0 })
    const soilMesh = new THREE.Mesh(soilGeom, soilMat)
    soilMesh.position.set(0, 0.081, 0)
    treeGroup.add(soilMesh)

    // Tree Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.12, 0.17, 1.8, 12)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3e28, roughness: 0.85 })
    const trunkMesh = new THREE.Mesh(trunkGeom, trunkMat)
    trunkMesh.position.set(0, 0.9, 0)
    trunkMesh.castShadow = true
    trunkMesh.receiveShadow = true
    treeGroup.add(trunkMesh)

    // Foliage Canopy Clustered Volumes (~3.5m apex)
    const foliageMatA = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 })
    const foliageMatB = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.8 })
    const foliageMatC = new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.8 })

    const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), foliageMatA)
    canopy1.position.set(0, 2.3, 0)
    canopy1.castShadow = true
    treeGroup.add(canopy1)

    const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), foliageMatB)
    canopy2.position.set(-0.25, 2.85, 0.15)
    canopy2.castShadow = true
    treeGroup.add(canopy2)

    const canopy3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 1), foliageMatC)
    canopy3.position.set(0.3, 2.65, -0.2)
    canopy3.castShadow = true
    treeGroup.add(canopy3)

    envGroup.add(treeGroup)

    // -------------------------------------------------------------
    // Human Figure Silhouette (~1.75m tall real scale) at X = +1.8m
    // -------------------------------------------------------------
    const personGroup = new THREE.Group()
    personGroup.position.set(1.8, 0, 0.2)
    const personMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.75,
      metalness: 0.1,
    })

    // Legs
    for (const legX of [-0.07, 0.07]) {
      const legGeom = new THREE.BoxGeometry(0.1, 0.82, 0.12)
      const legMesh = new THREE.Mesh(legGeom, personMat)
      legMesh.position.set(legX, 0.41, 0)
      legMesh.castShadow = true
      personGroup.add(legMesh)
    }

    // Torso / Jacket
    const torsoGeom = new THREE.BoxGeometry(0.36, 0.58, 0.2)
    const torsoMesh = new THREE.Mesh(torsoGeom, personMat)
    torsoMesh.position.set(0, 1.11, 0)
    torsoMesh.castShadow = true
    personGroup.add(torsoMesh)

    // Arms
    for (const armX of [-0.22, 0.22]) {
      const armGeom = new THREE.BoxGeometry(0.08, 0.6, 0.1)
      const armMesh = new THREE.Mesh(armGeom, personMat)
      armMesh.position.set(armX, 1.1, 0)
      armMesh.castShadow = true
      personGroup.add(armMesh)
    }

    // Head
    const headGeom = new THREE.SphereGeometry(0.11, 16, 16)
    const headMesh = new THREE.Mesh(headGeom, personMat)
    headMesh.position.set(0, 1.58, 0)
    headMesh.castShadow = true
    personGroup.add(headMesh)

    envGroup.add(personGroup)

    // 8. Sign Model Group in the Center (0, 0, 0)
    const signGroup = new THREE.Group()
    signGroupRef.current = signGroup
    scene.add(signGroup)

    // Initial render call for texture
    renderTextureToCanvas()

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !camera || !renderer) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // 10. Animation Loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)

      // Auto rotation
      if (autoRotateRef.current) {
        azimuthRef.current = (azimuthRef.current + 0.007) % (Math.PI * 2)
      }

      // Update camera position from spherical coordinates orbiting target
      const target = targetLookAtRef.current
      const dist = distanceRef.current
      const az = azimuthRef.current
      const el = elevationRef.current

      camera.position.x = target.x + dist * Math.cos(el) * Math.sin(az)
      camera.position.y = target.y + dist * Math.sin(el)
      camera.position.z = target.z + dist * Math.cos(el) * Math.cos(az)
      camera.lookAt(target.x, target.y, target.z)

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [renderTextureToCanvas])

  // -------------------------------------------------------------
  // Pointer Orbit & Wheel Zoom Controls
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    pointerPosRef.current = { x: e.clientX, y: e.clientY }
    setAutoRotate(false)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - pointerPosRef.current.x
    const dy = e.clientY - pointerPosRef.current.y
    pointerPosRef.current = { x: e.clientX, y: e.clientY }

    azimuthRef.current += dx * 0.007
    elevationRef.current = Math.max(-0.05, Math.min(1.15, elevationRef.current + dy * 0.005))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    distanceRef.current = Math.max(1.8, Math.min(7.0, distanceRef.current + e.deltaY * 0.003))
  }

  const setPresetAngle = (view: 'persp' | 'front' | 'side') => {
    setAutoRotate(false)
    setActivePresetView(view)
    if (view === 'front') {
      azimuthRef.current = 0
      elevationRef.current = 0.08
    } else if (view === 'persp') {
      azimuthRef.current = 0.45
      elevationRef.current = 0.18
    } else if (view === 'side') {
      azimuthRef.current = Math.PI / 2
      elevationRef.current = 0.08
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[#18244a22] bg-[#18244A06] p-4 sm:p-6 select-none overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#18244a15]">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#00A9D6] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-[.2em] text-[#18244A]">
            Maqueta 3D Real (WebGL) {title ? `· ${title}` : ''}
          </h3>
        </div>

        {/* Support Type Selector */}
        <div className="flex items-center gap-1 text-xs bg-white rounded-lg p-1 border border-[#18244a20] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSupport('paloma')}
            className={`px-2.5 py-1 rounded font-medium transition ${
              activeSupport === 'paloma'
                ? 'bg-[#18244A] text-white shadow-xs'
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
                ? 'bg-[#18244A] text-white shadow-xs'
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
                ? 'bg-[#18244A] text-white shadow-xs'
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
                ? 'bg-[#18244A] text-white shadow-xs'
                : 'text-[#667089] hover:text-[#18244A]'
            }`}
          >
            Mural / Adhesivo
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex h-[390px] w-full items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none bg-gradient-to-b from-sky-100/50 via-[#FAFAF7] to-neutral-200/70 rounded-xl mt-3 border border-[#18244a15]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* Real Scale Visual Labels in 3D Space */}
        {showEnvironment && (
          <>
            <div className="absolute left-6 bottom-4 pointer-events-none flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-full border border-neutral-300 shadow-xs">
              <span>🌳</span> Árbol ~3.5m
            </div>
            <div className="absolute right-6 bottom-4 pointer-events-none flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 bg-white/85 backdrop-blur-xs px-2.5 py-1 rounded-full border border-neutral-300 shadow-xs">
              <span>👤</span> Persona ~1.75m
            </div>
          </>
        )}

        {/* Dimension Badge in Center-Bottom */}
        <div className="absolute top-3 right-3 bg-[#18244A] text-white px-3 py-1.5 rounded-lg text-xs font-mono shadow-md border border-white/20 pointer-events-none">
          {widthCm} × {heightCm} cm
        </div>

        {/* Interaction Hint */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] text-[#18244A99] bg-white/70 backdrop-blur-xs px-2.5 py-1 rounded-md pointer-events-none">
          <span>↺</span> Arrastra para rotar en 360° · Rueda para zoom
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#18244a15]">
        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#667089] mr-1">Ángulo:</span>
          <button
            type="button"
            onClick={() => setPresetAngle('front')}
            className={`px-2.5 py-1 rounded border transition ${
              activePresetView === 'front'
                ? 'border-[#00A9D6] bg-[#00A9D615] font-bold text-[#00A9D6]'
                : 'border-[#18244a20] bg-white text-[#18244A] hover:bg-neutral-100'
            }`}
          >
            Frontal
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle('persp')}
            className={`px-2.5 py-1 rounded border transition ${
              activePresetView === 'persp'
                ? 'border-[#00A9D6] bg-[#00A9D615] font-bold text-[#00A9D6]'
                : 'border-[#18244a20] bg-white text-[#18244A] hover:bg-neutral-100'
            }`}
          >
            Perspectiva 3D
          </button>
          <button
            type="button"
            onClick={() => setPresetAngle('side')}
            className={`px-2.5 py-1 rounded border transition ${
              activePresetView === 'side'
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
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition ${
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
                ? 'bg-[#EF3785] text-white shadow-xs'
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
