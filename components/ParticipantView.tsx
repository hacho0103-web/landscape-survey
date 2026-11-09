'use client'

import { useState, useEffect } from 'react'
import Intake, { type IntakeData } from './Intake'
import Interview, { type InterviewPhoto } from './Interview'
import { COMPARISON_PAIR, findImage, selectInterviewImages } from '@/lib/interview'
import ThanksCharacter from './ThanksCharacter'
import Slideshow, { type Ratings, type ViewTimes } from './Slideshow'

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
  const [isInIntake, setIsInIntake] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [shuffledImages, setShuffledImages] = useState<string[]>([])
  const [isInterviewing, setIsInterviewing] = useState(false)
  const [interviewPhotos, setInterviewPhotos] = useState<InterviewPhoto[]>([])
  const [interviewAllEqual, setInterviewAllEqual] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [lastExperiment, setLastExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingResult, setPendingResult] = useState<{
    viewTimes: ViewTimes
    ratings: Ratings
  } | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  // 동의서대로 실험을 끝까지 마친 경우에만 저장하도록 완료 전까지 화면에만 둔다.
  const [contact, setContact] = useState('')
  const [contactFailed, setContactFailed] = useState(false)

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
    setIsInIntake(true)
  }

  // 동의와 인적사항을 마친 뒤에 기록을 만든다. 동의하지 않으면 아무것도 저장하지 않는다.
  // 기록 없이 진행하면 결과가 남지 않으므로 저장에 실패하면 시작하지 않는다.
  async function handleIntakeSubmit({ contact: enteredContact, ...data }: IntakeData) {
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, researchConsent: true, imageOrder: shuffledImages }),
      })
      if (!res.ok) return false
      setLastExperiment(await res.json())
    } catch {
      return false
    }
    setContact(enteredContact)
    setIsInIntake(false)
    setIsRunning(true)
    return true
  }

  function saveRating(filename: string, values: number[]) {
    if (!lastExperiment) return
    // 실패해도 실험이 끝날 때 전체 응답을 다시 보내므로 진행을 막지 않는다.
    fetch(`/api/experiments/${lastExperiment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: { filename, values } }),
    }).catch(() => {})
  }

  async function saveResult(viewTimes: ViewTimes, ratings: Ratings, completed: boolean) {
    if (!lastExperiment) return false
    try {
      const res = await fetch(`/api/experiments/${lastExperiment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewTimes, ratings, completed }),
      })
      return res.ok || res.status === 409 // 409: 이미 저장됨
    } catch {
      return false
    }
  }

  async function handleComplete(viewTimes: ViewTimes, ratings: Ratings) {
    // 참가자가 준 점수로 상위·하위 사진을 고르고, 순위가 드러나지 않게 A~F 자리를 섞는다.
    const selection = selectInterviewImages(shuffledImages, ratings)
    setInterviewPhotos(
      shuffle(selection.images).map(({ filename, group }) => ({ filename, group }))
    )
    setInterviewAllEqual(selection.allEqual)
    setIsRunning(false)
    setIsInterviewing(true)
    setPendingResult({ viewTimes, ratings })
    setSaveFailed(!(await saveResult(viewTimes, ratings, true)))
  }

  async function handleInterviewSubmit(interviewAnswers: string[]) {
    if (!lastExperiment) return false
    try {
      const res = await fetch(`/api/experiments/${lastExperiment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewAnswers,
          interviewImages: interviewPhotos.map((photo) => photo.filename),
          interviewPair: COMPARISON_PAIR,
        }),
      })
      if (!res.ok && res.status !== 409) return false
    } catch {
      return false
    }
    setIsInterviewing(false)
    setIsComplete(true)
    setContactFailed(!(await saveContact()))
    return true
  }

  async function saveContact() {
    if (!contact || !lastExperiment) return true
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId: lastExperiment.id, contact }),
      })
      return res.ok || res.status === 409 // 409: 이미 저장됨
    } catch {
      return false
    }
  }

  async function handleRetryContact() {
    setContactFailed(!(await saveContact()))
  }

  async function handleRetrySave() {
    if (!pendingResult) return
    setSaveFailed(!(await saveResult(pendingResult.viewTimes, pendingResult.ratings, true)))
  }

  function handleExit(viewTimes: ViewTimes, ratings: Ratings) {
    setIsRunning(false)
    setIsComplete(false)
    saveResult(viewTimes, ratings, false)
    setLastExperiment(null)
    setContact('')
  }

  function handleReset() {
    setIsComplete(false)
    setLastExperiment(null)
    setPendingResult(null)
    setSaveFailed(false)
    setContact('')
    setContactFailed(false)
  }

  if (isInIntake) {
    return <Intake onSubmit={handleIntakeSubmit} onCancel={() => setIsInIntake(false)} />
  }

  if (isRunning) {
    return (
      <Slideshow
        images={shuffledImages}
        onRate={saveRating}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    )
  }

  if (isInterviewing) {
    return (
      <Interview
        photos={interviewPhotos}
        allEqual={interviewAllEqual}
        pair={COMPARISON_PAIR.map((filename) => findImage(images, filename))}
        onSubmit={handleInterviewSubmit}
      />
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-6">
        <ThanksCharacter mood="happy" message="감사합니다!" />
        <h2 className="text-4xl font-bold tracking-tight text-neutral-900">
          실험이 완료되었습니다
        </h2>
        {lastExperiment && (
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-neutral-900 to-neutral-700 rounded-2xl px-14 py-7 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
            <p className="text-sm text-white/70">실험 번호</p>
            <p className="text-5xl font-bold tracking-tight text-white break-all">
              {lastExperiment.label}
            </p>
            <p className="text-xs text-white/50 font-mono">기록 ID: {lastExperiment.id}</p>
          </div>
        )}
        {saveFailed && (
          <div className="flex flex-col items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-6 py-4">
            <p className="text-sm text-red-700">
              응답 저장에 실패했습니다. 화면을 닫지 말고 다시 시도해주세요.
            </p>
            <button
              onClick={handleRetrySave}
              className="text-sm font-medium text-red-700 underline"
            >
              다시 저장
            </button>
          </div>
        )}
        {contactFailed && (
          <div className="flex flex-col items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-6 py-4">
            <p className="text-sm text-red-700">
              연락처 저장에 실패했습니다. 화면을 닫지 말고 다시 시도해주세요.
            </p>
            <button
              onClick={handleRetryContact}
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
    <div className="flex flex-col items-center min-h-[calc(100vh-10rem)]">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-12">
        <div className="text-center">
          <p className="inline-block mb-6 rounded-xl border border-neutral-300 bg-neutral-50 px-5 py-3 text-base font-medium leading-relaxed text-neutral-800 text-balance">
            휴대폰에서는 실험을 진행할 수 없습니다.
            <br />
            최소한 컴퓨터 모니터 이상의, 가능한 한 큰 화면에서 참여해 주세요.
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight text-balance text-neutral-900">
            대규모 업무시설 저층부 보행자 경관 인식 조사 실험
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600">
            버튼을 누르면 연구 안내와 실험이 시작됩니다.
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
          <div className="flex flex-col items-center gap-4">
            <ThanksCharacter mood="crying" message="대학원생을 도와주세요…" />
            <button
              onClick={startExperiment}
              className="btn-primary px-10 py-3 text-base font-semibold"
            >
              실험 시작
            </button>
            <p className="text-sm text-neutral-500">
              준비된 이미지 {images.length}개 · ESC 키를 누르면 실험을 중단합니다.
            </p>
          </div>
        )}
      </div>

      <p className="text-center text-sm leading-relaxed text-neutral-500">
        연세대학교 일반대학원 건축공학과
        <br />
        CAT 건축도시디자인 연구실 조하은 연구원
      </p>
    </div>
  )
}
