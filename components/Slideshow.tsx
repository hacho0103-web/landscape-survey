'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { RATING_QUESTIONS } from '@/lib/ratings'
import RatingPanel from './RatingPanel'
import Tutorial from './Tutorial'

export type ViewTimes = Record<string, number>
export type Ratings = Record<string, number[]>

interface SlideshowProps {
  images: string[]
  onRate: (filename: string, values: number[]) => void
  onComplete: (viewTimes: ViewTimes, ratings: Ratings) => void
  onExit: (viewTimes: ViewTimes, ratings: Ratings) => void
}

function imageUrl(filename: string) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}

const EMPTY_RATING: (number | null)[] = RATING_QUESTIONS.map(() => null)

function isRated(values: (number | null)[] | undefined): values is number[] {
  return !!values && values.every((value) => value !== null)
}

export default function Slideshow({
  images,
  onRate,
  onComplete,
  onExit,
}: SlideshowProps) {
  const [hasBegun, setHasBegun] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [confirming, setConfirming] = useState<'complete' | 'exit' | null>(null)
  const [responses, setResponses] = useState<Record<string, (number | null)[]>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const viewTimesRef = useRef<ViewTimes>({})
  const viewingRef = useRef<{ filename: string; since: number } | null>(null)

  const isFirst = currentIndex === 0
  const isLast = currentIndex === images.length - 1
  const currentImage = images[currentIndex]
  const currentValues = responses[currentImage] ?? EMPTY_RATING
  const isCurrentRated = isRated(currentValues)

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

  // 이미지를 떠날 때마다 저장해서 중간에 창이 닫혀도 응답이 남게 한다.
  const saveCurrentRating = useCallback(() => {
    const values = responses[currentImage]
    if (isRated(values)) onRate(currentImage, values)
  }, [responses, currentImage, onRate])

  const finishedRatings = useCallback(() => {
    const ratings: Ratings = {}
    for (const [filename, values] of Object.entries(responses)) {
      if (isRated(values)) ratings[filename] = values
    }
    return ratings
  }, [responses])

  const handleNext = useCallback(() => {
    if (!isCurrentRated) return
    if (isLast) {
      setConfirming('complete')
    } else {
      stopViewing()
      saveCurrentRating()
      setCurrentIndex((index) => index + 1)
    }
  }, [isCurrentRated, isLast, stopViewing, saveCurrentRating])

  const handlePrev = useCallback(() => {
    if (isFirst) return
    stopViewing()
    saveCurrentRating()
    setCurrentIndex((index) => index - 1)
  }, [isFirst, stopViewing, saveCurrentRating])

  const handleComplete = useCallback(() => {
    stopViewing()
    exitFullscreen()
    onComplete(viewTimesRef.current, finishedRatings())
  }, [stopViewing, exitFullscreen, onComplete, finishedRatings])

  const handleExit = useCallback(() => {
    stopViewing()
    exitFullscreen()
    onExit(viewTimesRef.current, finishedRatings())
  }, [stopViewing, exitFullscreen, onExit, finishedRatings])

  function handleRatingChange(questionIndex: number, value: number) {
    setResponses((prev) => ({
      ...prev,
      [currentImage]: (prev[currentImage] ?? EMPTY_RATING).map((current, index) =>
        index === questionIndex ? value : current
      ),
    }))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasBegun) {
        if (e.key === 'Escape') handleExit()
        return
      }
      // 완료 확인 중에는 화살표로 끝나지 않게 하고, 돌아가기만 허용한다.
      if (confirming) {
        if (e.key === 'Escape' || e.key === 'ArrowLeft') setConfirming(null)
        return
      }
      if (e.key === 'Escape') {
        handleExit()
        return
      }
      // 키를 누르고 있어도 한 장씩만 넘어가도록 자동 반복은 무시한다.
      if (e.repeat) return
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasBegun, confirming, handleExit, handleNext, handlePrev])

  // 넘길 때 빈 화면이 보이지 않도록 앞뒤 이미지를 미리 불러온다.
  useEffect(() => {
    for (const index of [currentIndex - 1, currentIndex, currentIndex + 1]) {
      if (images[index]) new Image().src = imageUrl(images[index])
    }
  }, [currentIndex, images])

  const progress = images.length > 0 ? ((currentIndex + 1) / images.length) * 100 : 0
  const buttonClass =
    'px-4 py-1.5 text-sm text-white/60 border border-white/20 rounded-md hover:text-white hover:border-white/50 transition-colors disabled:opacity-30 disabled:hover:text-white/60 disabled:hover:border-white/20'

  // 전체화면이 끊기지 않도록 튜토리얼도 같은 컨테이너 안에서 보여준다.
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex flex-col z-50"
      style={{ width: '100vw', height: '100vh' }}
    >
      {!hasBegun ? (
        <Tutorial
          imageCount={images.length}
          onStart={() => setHasBegun(true)}
          onCancel={handleExit}
        />
      ) : (
        <>
      <div className="flex-1 min-h-0 flex">
      <div className="flex-1 min-w-0">
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

      {/* 이미지를 가리지 않도록 평가표는 이미지 영역 밖의 오른쪽에 둔다. */}
      <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-white/10 p-6 flex flex-col justify-center">
        <RatingPanel values={currentValues} onChange={handleRatingChange} />
        <p className={`mt-6 text-sm text-white/60 ${isCurrentRated ? 'invisible' : ''}`}>
          세 문항에 모두 응답하면 다음으로 넘어갈 수 있습니다.
        </p>
      </aside>
      </div>

      {/* 이미지를 가리지 않도록 조작 요소는 이미지 영역 밖의 하단 띠에 둔다. */}
      <div className="shrink-0">
        <div className="h-0.5 bg-white/10">
          <div className="h-full bg-white/40" style={{ width: `${progress}%` }} />
        </div>
        {confirming ? (
          <div className="h-12 px-6 flex items-center justify-between">
            <button onClick={() => setConfirming(null)} className={buttonClass}>
              ← 돌아가기
            </button>
            <span className="text-sm text-white">
              {confirming === 'complete' ? '실험을 완료할까요?' : '실험을 나갈까요?'}
            </span>
            <button
              onClick={confirming === 'complete' ? handleComplete : handleExit}
              autoFocus
              className="px-4 py-1.5 text-sm font-semibold bg-white text-black rounded-md hover:bg-white/90 transition-colors"
            >
              {confirming === 'complete' ? '완료' : '나가기'}
            </button>
          </div>
        ) : (
          <div className="h-12 px-6 grid grid-cols-3 items-center">
            <button
              onClick={() => setConfirming('exit')}
              className={`${buttonClass} justify-self-start`}
            >
              나가기
            </button>
            <span className="text-sm font-semibold text-white text-center">
              이미지 {currentIndex + 1} / {images.length}
            </span>
            <div className="flex gap-2 justify-self-end">
              <button onClick={handlePrev} disabled={isFirst} className={buttonClass}>
                ← 이전
              </button>
              <button onClick={handleNext} disabled={!isCurrentRated} className={buttonClass}>
                {isLast ? '완료' : '다음 →'}
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}
