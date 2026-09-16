'use client'

import { useState, useEffect } from 'react'
import Slideshow from './Slideshow'

interface Experiment {
  id: string
  label: string
  date: string
  imageOrder: string[]
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function ParticipantView() {
  const [images, setImages] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [shuffledImages, setShuffledImages] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [lastExperiment, setLastExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    fetchImages()
  }, [])

  async function fetchImages() {
    setLoading(true)
    try {
      const res = await fetch('/api/images')
      const data = await res.json()
      setImages(data.images)
    } catch {
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  async function startExperiment() {
    if (images.length === 0) return
    setStarting(true)
    const ordered = shuffle(images)
    setShuffledImages(ordered)

    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageOrder: ordered }),
      })
      const exp = await res.json()
      setLastExperiment(exp)
    } catch {
      // 실험은 계속 진행
    }

    setIsComplete(false)
    setStarting(false)
    setIsRunning(true)
  }

  function handleComplete() {
    setIsRunning(false)
    setIsComplete(true)
  }

  function handleExit() {
    setIsRunning(false)
    setIsComplete(false)
  }

  function handleReset() {
    setIsComplete(false)
    setLastExperiment(null)
  }

  if (isRunning) {
    return (
      <Slideshow
        images={shuffledImages}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="text-5xl">완료</div>
        <h2 className="text-2xl font-bold text-gray-800">실험이 완료되었습니다</h2>
        {lastExperiment && (
          <p className="text-gray-500 text-sm">
            기록 ID: <span className="font-mono">{lastExperiment.id}</span>
          </p>
        )}
        <button
          onClick={handleReset}
          className="mt-4 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          처음으로
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">실험 시작</h2>
        <p className="text-gray-500">
          버튼을 누르면 이미지가 무작위 순서로 전체화면에 3초씩 표시됩니다.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400">이미지 불러오는 중...</p>
      ) : images.length === 0 ? (
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-700 font-medium">업로드된 이미지가 없습니다.</p>
          <p className="text-yellow-600 text-sm mt-1">
            연구자 탭에서 이미지를 먼저 업로드해주세요.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 text-sm text-gray-600">
            준비된 이미지 <span className="font-bold text-gray-900">{images.length}</span>개
          </div>
          <button
            onClick={startExperiment}
            disabled={starting}
            className="px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {starting ? '준비 중...' : '실험 시작'}
          </button>
          <p className="text-gray-400 text-xs">ESC 키를 누르면 실험을 중단합니다.</p>
        </>
      )}
    </div>
  )
}
