'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface SlideshowProps {
  images: string[]
  onComplete: () => void
  onExit: () => void
}

function imageUrl(filename: string) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}

export default function Slideshow({ images, onComplete, onExit }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const isFirst = currentIndex === 0
  const isLast = currentIndex === images.length - 1

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
    return () => exitFullscreen()
  }, [requestFullscreen, exitFullscreen])

  const handleNext = useCallback(() => {
    if (isLast) {
      exitFullscreen()
      onComplete()
    } else {
      setCurrentIndex((index) => index + 1)
    }
  }, [isLast, onComplete, exitFullscreen])

  const handlePrev = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFullscreen()
        onExit()
        return
      }
      // 키를 누르고 있어도 한 장씩만 넘어가도록 자동 반복은 무시한다.
      if (e.repeat) return
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onExit, exitFullscreen, handleNext, handlePrev])

  // 넘길 때 빈 화면이 보이지 않도록 앞뒤 이미지를 미리 불러온다.
  useEffect(() => {
    for (const index of [currentIndex - 1, currentIndex + 1]) {
      if (images[index]) new Image().src = imageUrl(images[index])
    }
  }, [currentIndex, images])

  const progress = images.length > 0 ? ((currentIndex + 1) / images.length) * 100 : 0
  const buttonClass =
    'px-4 py-1.5 text-sm text-white/60 border border-white/20 rounded-md hover:text-white hover:border-white/50 transition-colors disabled:opacity-30 disabled:hover:text-white/60 disabled:hover:border-white/20'

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex flex-col z-50"
      style={{ width: '100vw', height: '100vh' }}
    >
      <div className="flex-1 min-h-0">
        <img
          key={currentIndex}
          src={imageUrl(images[currentIndex])}
          alt={`이미지 ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* 이미지를 가리지 않도록 조작 요소는 이미지 영역 밖의 하단 띠에 둔다. */}
      <div className="shrink-0">
        <div className="h-0.5 bg-white/10">
          <div className="h-full bg-white/40" style={{ width: `${progress}%` }} />
        </div>
        <div className="h-12 px-6 flex items-center justify-between">
          <button onClick={handlePrev} disabled={isFirst} className={buttonClass}>
            ← 이전
          </button>
          <span className="text-sm font-mono text-white/60">
            {currentIndex + 1} / {images.length}
          </span>
          <button onClick={handleNext} className={buttonClass}>
            {isLast ? '완료' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
