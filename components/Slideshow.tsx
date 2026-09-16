'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface SlideshowProps {
  images: string[]
  onComplete: () => void
  onExit: () => void
}

export default function Slideshow({ images, onComplete, onExit }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const requestFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (el.requestFullscreen) el.requestFullscreen()
    else if ((el as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen)
      (el as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen!()
  }, [])

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    requestFullscreen()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      exitFullscreen()
    }
  }, [requestFullscreen, exitFullscreen])

  useEffect(() => {
    if (isDone) return
    if (currentIndex >= images.length) {
      setIsDone(true)
      exitFullscreen()
      onComplete()
      return
    }
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
    }, 3000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [currentIndex, images.length, isDone, onComplete, exitFullscreen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFullscreen()
        onExit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onExit, exitFullscreen])

  const progress = images.length > 0 ? ((currentIndex) / images.length) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50"
      style={{ width: '100vw', height: '100vh' }}
    >
      {!isDone && currentIndex < images.length ? (
        <>
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-white/50 transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 순서 번호 - 왼쪽 위 */}
          <div className="absolute top-4 left-6 text-white text-2xl font-bold drop-shadow-lg">
            {currentIndex + 1}
          </div>

          {/* Image count - 오른쪽 위 */}
          <div className="absolute top-4 right-6 text-white/60 text-sm font-mono">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Image */}
          <img
            key={currentIndex}
            src={`/uploads/${images[currentIndex]}`}
            alt={`이미지 ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            style={{ width: '100vw', height: '100vh', objectFit: 'contain' }}
          />

          {/* 3초 타이머 바 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              key={currentIndex}
              className="h-full bg-white/70"
              style={{
                animation: 'timer-progress 3s linear forwards',
              }}
            />
          </div>
        </>
      ) : null}

      <style>{`
        @keyframes timer-progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  )
}
