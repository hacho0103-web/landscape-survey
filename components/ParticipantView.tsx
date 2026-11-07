'use client'

import { useState, useEffect } from 'react'
import Slideshow, { type ViewTimes } from './Slideshow'

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
  const [startError, setStartError] = useState(false)
  const [pendingViewTimes, setPendingViewTimes] = useState<ViewTimes | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)

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
    setStartError(false)
    const ordered = shuffle(images)
    setShuffledImages(ordered)

    // 기록 없이 진행하면 결과가 남지 않으므로 저장에 실패하면 시작하지 않는다.
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageOrder: ordered }),
      })
      if (!res.ok) throw new Error('save failed')
      setLastExperiment(await res.json())
    } catch {
      setStartError(true)
      setStarting(false)
      return
    }

    setIsComplete(false)
    setStarting(false)
    setIsRunning(true)
  }

  async function saveViewTimes(viewTimes: ViewTimes, completed: boolean) {
    if (!lastExperiment) return false
    try {
      const res = await fetch(`/api/experiments/${lastExperiment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewTimes, completed }),
      })
      return res.ok || res.status === 409 // 409: 이미 저장됨
    } catch {
      return false
    }
  }

  async function handleComplete(viewTimes: ViewTimes) {
    setIsRunning(false)
    setIsComplete(true)
    setPendingViewTimes(viewTimes)
    setSaveFailed(!(await saveViewTimes(viewTimes, true)))
  }

  async function handleRetrySave() {
    if (!pendingViewTimes) return
    setSaveFailed(!(await saveViewTimes(pendingViewTimes, true)))
  }

  function handleExit(viewTimes: ViewTimes) {
    setIsRunning(false)
    setIsComplete(false)
    saveViewTimes(viewTimes, false)
  }

  function handleReset() {
    setIsComplete(false)
    setLastExperiment(null)
    setPendingViewTimes(null)
    setSaveFailed(false)
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
        {saveFailed && (
          <div className="flex flex-col items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-6 py-4">
            <p className="text-sm text-red-700">
              관람 시간 저장에 실패했습니다. 화면을 닫지 말고 다시 시도해주세요.
            </p>
            <button
              onClick={handleRetrySave}
              className="text-sm font-medium text-red-700 underline"
            >
              다시 저장
            </button>
          </div>
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
          버튼을 누르면 이미지가 무작위 순서로 전체화면에 표시됩니다.
          <br />
          시간제한 없이 ←, → 키나 화면 아래 버튼으로 이미지를 넘기고, 나가기 버튼으로 끝낼 수 있습니다.
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
          {startError && (
            <p className="text-sm text-red-600">
              실험 기록을 만들지 못했습니다. 다시 시도해주세요.
            </p>
          )}
          <p className="text-gray-400 text-xs">ESC 키를 누르면 실험을 중단합니다.</p>
        </>
      )}
    </div>
  )
}
