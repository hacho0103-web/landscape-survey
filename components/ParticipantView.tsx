'use client'

import { useState, useEffect } from 'react'
import Interview from './Interview'
import Slideshow, { type BeginResult, type ViewTimes } from './Slideshow'

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
  const [isInterviewing, setIsInterviewing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [lastExperiment, setLastExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)
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

  function startExperiment() {
    if (images.length === 0) return
    setShuffledImages(shuffle(images))
    setIsComplete(false)
    setIsRunning(true)
  }

  // 튜토리얼에서 시작을 눌렀을 때 호출된다. 튜토리얼만 보고 나가면 기록이 남지 않는다.
  // 기록 없이 진행하면 결과가 남지 않으므로 저장에 실패하면 시작하지 않는다.
  async function createExperiment(participantId: string): Promise<BeginResult> {
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageOrder: shuffledImages, participantId }),
      })
      if (res.status === 409) return 'duplicate'
      if (!res.ok) return 'error'
      setLastExperiment(await res.json())
      return 'ok'
    } catch {
      return 'error'
    }
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
    setIsInterviewing(true)
    setPendingViewTimes(viewTimes)
    setSaveFailed(!(await saveViewTimes(viewTimes, true)))
  }

  async function handleInterviewSubmit(interviewAnswers: string[]) {
    if (!lastExperiment) return false
    try {
      const res = await fetch(`/api/experiments/${lastExperiment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewAnswers }),
      })
      if (!res.ok && res.status !== 409) return false
    } catch {
      return false
    }
    setIsInterviewing(false)
    setIsComplete(true)
    return true
  }

  async function handleRetrySave() {
    if (!pendingViewTimes) return
    setSaveFailed(!(await saveViewTimes(pendingViewTimes, true)))
  }

  function handleExit(viewTimes: ViewTimes) {
    setIsRunning(false)
    setIsComplete(false)
    saveViewTimes(viewTimes, false)
    setLastExperiment(null)
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
        onBegin={createExperiment}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    )
  }

  if (isInterviewing) {
    return <Interview onSubmit={handleInterviewSubmit} />
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <h2 className="text-4xl font-bold tracking-tight text-neutral-900">
          실험이 완료되었습니다
        </h2>
        {lastExperiment && (
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-neutral-900 to-neutral-700 rounded-2xl px-14 py-7 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
            <p className="text-sm text-white/70">평가지에 아래 번호를 적어주세요</p>
            <p className="text-5xl font-bold tracking-tight text-white break-all">
              {lastExperiment.label}
            </p>
            <p className="text-xs text-white/50 font-mono">기록 ID: {lastExperiment.id}</p>
          </div>
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
          className="btn-secondary mt-2 px-6 py-3"
        >
          처음으로
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-8">
      <div className="text-center">
        <h2 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight text-balance text-neutral-900">
          대규모 업무시설 저층부 보행자 경관 인식 조사 실험
        </h2>
        <p className="mt-5 text-lg leading-relaxed font-medium text-neutral-700">
          연세대학교 일반대학원 건축공학과
          <br />
          CAT 건축도시디자인 연구실 조하은 연구원
        </p>
        <p className="mt-10 text-lg leading-relaxed text-neutral-600">
          버튼을 누르면 튜토리얼이 시작됩니다. 보고 진행해주세요.
          <br />
          시간제한 없이 ←, → 키나 화면 아래 버튼으로 이미지를 넘기고, 나가기 버튼으로 끝낼 수 있습니다.
        </p>
      </div>

      {loading ? (
        <p className="text-neutral-400">이미지 불러오는 중...</p>
      ) : images.length === 0 ? (
        <div className="card text-center px-8 py-6">
          <p className="text-neutral-900 font-medium">업로드된 이미지가 없습니다.</p>
          <p className="text-neutral-500 text-sm mt-1">
            연구자 탭에서 이미지를 먼저 업로드해주세요.
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={startExperiment}
            className="btn-primary px-12 py-4 text-lg font-semibold"
          >
            실험 시작
          </button>
          <p className="text-sm text-neutral-500">
            준비된 이미지{' '}
            <span className="font-semibold text-neutral-900">{images.length}</span>개 · ESC 키를
            누르면 실험을 중단합니다.
          </p>
        </>
      )}
    </div>
  )
}
