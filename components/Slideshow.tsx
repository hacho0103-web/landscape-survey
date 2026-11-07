'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type ViewTimes = Record<string, number>

interface SlideshowProps {
  images: string[]
  onComplete: (viewTimes: ViewTimes) => void
  onExit: (viewTimes: ViewTimes) => void
}

function imageUrl(filename: string) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}

export default function Slideshow({ images, onComplete, onExit }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isConfirming, setIsConfirming] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewTimesRef = useRef<ViewTimes>({})
  const viewingRef = useRef<{ filename: string; since: number } | null>(null)

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

  // 이미지가 실제로 표시된 시점부터 다음으로 넘어갈 때까지를 잰다.
  const stopViewing = useCallback(() => {
    const viewing = viewingRef.current
    if (!viewing) return
    const elapsed = Math.round(performance.now() - viewing.since)
    viewTimesRef.current[viewing.filename] =
      (viewTimesRef.current[viewing.filename] ?? 0) + elapsed
    viewingRef.current = null
  }, [])

  const handleNext = useCallback(() => {
    if (isLast) {
      setIsConfirming(true)
    } else {
      stopViewing()
      setCurrentIndex((index) => index + 1)
    }
  }, [isLast, stopViewing])

  const handlePrev = useCallback(() => {
    if (isFirst) return
    stopViewing()
    setCurrentIndex((index) => index - 1)
  }, [isFirst, stopViewing])

  const handleComplete = useCallback(() => {
    stopViewing()
    exitFullscreen()
    onComplete(viewTimesRef.current)
  }, [stopViewing, exitFullscreen, onComplete])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 완료 확인 중에는 화살표로 끝나지 않게 하고, 돌아가기만 허용한다.
      if (isConfirming) {
        if (e.key === 'Escape' || e.key === 'ArrowLeft') setIsConfirming(false)
        return
      }
      if (e.key === 'Escape') {
        stopViewing()
        exitFullscreen()
        onExit(viewTimesRef.current)
        return
      }
      // 키를 누르고 있어도 한 장씩만 넘어가도록 자동 반복은 무시한다.
      if (e.repeat) return
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isConfirming, onExit, exitFullscreen, stopViewing, handleNext, handlePrev])

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
          onLoad={() => {
            viewingRef.current = {
              filename: images[currentIndex],
              since: performance.now(),
            }
          }}
        />
      </div>

      {/* 이미지를 가리지 않도록 조작 요소는 이미지 영역 밖의 하단 띠에 둔다. */}
      <div className="shrink-0">
        <div className="h-0.5 bg-white/10">
          <div className="h-full bg-white/40" style={{ width: `${progress}%` }} />
        </div>
        {isConfirming ? (
          <div className="h-12 px-6 flex items-center justify-between">
            <button onClick={() => setIsConfirming(false)} className={buttonClass}>
              ← 돌아가기
            </button>
            <span className="text-sm text-white">실험을 완료할까요?</span>
            <button
              onClick={handleComplete}
              autoFocus
              className="px-4 py-1.5 text-sm font-semibold bg-white text-black rounded-md hover:bg-white/90 transition-colors"
            >
              완료
            </button>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}
