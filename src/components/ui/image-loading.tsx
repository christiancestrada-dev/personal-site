"use client"

import { useState, useEffect, useRef, useMemo, useCallback, CSSProperties } from 'react'

interface GridCell {
  id: string
  x: number
  y: number
  blinkDelay: number
  fadeDelay: number
  initialOpacity: number
  color: string | null
}

interface ImageLoaderProps {
  src: string
  alt?: string
  aspectWidth?: number
  aspectHeight?: number
  gridSize?: number
  cellShape?: "circle" | "square"
  cellGap?: number
  cellColor?: string
  blinkSpeed?: number
  transitionDuration?: number
  fadeOutDuration?: number
  loadingDelay?: number
  priority?: boolean
  onLoad?: () => void
  className?: string
}

export default function ImageLoader({
  src,
  alt = "",
  aspectWidth = 800,
  aspectHeight = 600,
  gridSize = 24,
  cellShape = "square",
  cellGap = 3,
  cellColor = "#1a1a1a",
  blinkSpeed = 1200,
  transitionDuration = 600,
  fadeOutDuration = 500,
  loadingDelay = 0,
  priority = false,
  onLoad = () => {},
  className = "",
}: ImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showImage, setShowImage] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [gridRemoved, setGridRemoved] = useState(false)
  const [gridCells, setGridCells] = useState<GridCell[]>([])

  const imageRef = useRef<HTMLImageElement>(null)
  const processedRef = useRef(false)
  const loadStartRef = useRef(Date.now())

  const dimensions = useMemo(() => ({ width: aspectWidth, height: aspectHeight }), [aspectWidth, aspectHeight])

  // Build grid
  useEffect(() => {
    if (gridRemoved) return
    const step = gridSize + cellGap
    const cols = Math.ceil(dimensions.width / step) + 1
    const rows = Math.ceil(dimensions.height / step) + 1
    const cells: GridCell[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({
          id: `${r}-${c}`,
          x: c * step,
          y: r * step,
          blinkDelay: Math.random() * blinkSpeed,
          fadeDelay: Math.random() * fadeOutDuration,
          initialOpacity: Math.random() * 0.7 + 0.3,
          color: null,
        })
      }
    }
    setGridCells(cells)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.width, dimensions.height, gridSize, cellGap, blinkSpeed, fadeOutDuration])

  // Remove grid from DOM after fade-out completes
  useEffect(() => {
    if (!isFadingOut || gridCells.length === 0) return
    const maxDelay = Math.max(...gridCells.map(c => c.fadeDelay))
    const t = setTimeout(() => setGridRemoved(true), fadeOutDuration + maxDelay + 150)
    return () => clearTimeout(t)
  }, [isFadingOut, fadeOutDuration, gridCells])

  const sampleColor = useCallback((canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number): string => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return cellColor
    const data = ctx.getImageData(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h)).data
    let r = 0, g = 0, b = 0, count = 0
    for (let i = 0; i < data.length; i += 16) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++ }
    if (count === 0) return cellColor
    return `rgb(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)})`
  }, [cellColor])

  const processImage = useCallback((img: HTMLImageElement, cells: GridCell[]) => {
    if (processedRef.current || cells.length === 0) return
    processedRef.current = true

    const run = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0)

      const sx = img.naturalWidth / dimensions.width
      const sy = img.naturalHeight / dimensions.height

      setGridCells(cells.map(cell => ({
        ...cell,
        color: sampleColor(canvas, Math.floor(cell.x * sx), Math.floor(cell.y * sy), Math.max(1, Math.floor(gridSize * sx)), Math.max(1, Math.floor(gridSize * sy)))
      })))

      setIsLoading(false)
      setIsTransitioning(true)
      setTimeout(() => setShowImage(true), transitionDuration)
      setTimeout(() => { setIsTransitioning(false); setIsFadingOut(true) }, transitionDuration)
      onLoad()
    }

    if (loadingDelay > 0) {
      const elapsed = Date.now() - loadStartRef.current
      setTimeout(run, Math.max(0, loadingDelay - elapsed))
    } else {
      run()
    }
  }, [dimensions, gridSize, transitionDuration, loadingDelay, sampleColor, onLoad])

  useEffect(() => {
    const img = imageRef.current
    if (!img) return
    if (img.complete && img.naturalWidth > 0) {
      processImage(img, gridCells)
    } else {
      const handle = () => processImage(img, gridCells)
      img.addEventListener('load', handle)
      return () => img.removeEventListener('load', handle)
    }
  }, [gridCells, processImage])

  const getCellStyle = useCallback((cell: GridCell): CSSProperties => {
    const base: CSSProperties = { position: 'absolute', left: cell.x, top: cell.y }

    if (isLoading) return {
      ...base,
      animation: `image-cell-blink ${blinkSpeed}ms infinite`,
      animationDelay: `${cell.blinkDelay}ms`,
      animationFillMode: 'backwards',
      backgroundColor: cellColor,
      width: gridSize,
      height: gridSize,
      opacity: cell.initialOpacity,
    }

    if (isTransitioning) return {
      ...base,
      backgroundColor: cell.color || cellColor,
      transition: `background-color ${transitionDuration}ms ease, width ${transitionDuration}ms ease, height ${transitionDuration}ms ease, left ${transitionDuration}ms ease, top ${transitionDuration}ms ease, opacity ${transitionDuration}ms ease`,
      width: gridSize + cellGap,
      height: gridSize + cellGap,
      left: cell.x - cellGap / 2,
      top: cell.y - cellGap / 2,
      opacity: 1,
      animation: 'none',
    }

    if (isFadingOut) return {
      ...base,
      backgroundColor: cell.color || cellColor,
      opacity: 0,
      transition: `opacity ${fadeOutDuration}ms ease`,
      transitionDelay: `${cell.fadeDelay}ms`,
      width: gridSize + cellGap,
      height: gridSize + cellGap,
      left: cell.x - cellGap / 2,
      top: cell.y - cellGap / 2,
    }

    return base
  }, [isLoading, isTransitioning, isFadingOut, blinkSpeed, cellColor, gridSize, cellGap, transitionDuration, fadeOutDuration])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: '100%', aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
    >
      {!gridRemoved && gridCells.length > 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {gridCells.map(cell => (
            <div
              key={cell.id}
              className={cellShape === 'circle' ? 'rounded-full' : 'rounded-sm'}
              style={getCellStyle(cell)}
            />
          ))}
        </div>
      )}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        loading={priority ? "eager" : "lazy"}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: showImage ? 1 : 0, transition: 'opacity 300ms ease' }}
      />
    </div>
  )
}
