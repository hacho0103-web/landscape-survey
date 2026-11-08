'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  INTERVIEW_Q3_ALL_EQUAL,
  INTERVIEW_QUESTIONS,
  MAX_ANSWER_LENGTH,
  PHOTO_LETTERS,
  type PhotoGroup,
} from '@/lib/interview'

export interface InterviewPhoto {
  filename: string
  group: PhotoGroup
}

interface InterviewProps {
  photos: InterviewPhoto[] // 사진 A부터 순서대로
  allEqual: boolean
  pair: (string | undefined)[] // 4번 사진 A, B. 이미지가 없으면 undefined
  onSubmit: (answers: string[]) => Promise<boolean>
}

interface Zoomed {
  src: string
  caption: string
}

function imageUrl(filename: string) {
  return `/api/uploads/${encodeURIComponent(filename)}`
}

const GROUP_LABEL: Record<PhotoGroup, string> = {
  high: '높게 평가한 사진',
  low: '낮게 평가한 사진',
}

function PhotoCard({
  filename,
  caption,
  badge,
  badgeTone,
  onZoom,
}: {
  filename: string | undefined
  caption: string
  badge?: string
  badgeTone?: PhotoGroup
  onZoom: (zoomed: Zoomed) => void
}) {
  return (
    <figure className="flex flex-col gap-2">
      {filename ? (
        <button
          type="button"
          onClick={() => onZoom({ src: imageUrl(filename), caption })}
          className="group relative aspect-video overflow-hidden rounded-xl bg-neutral-100 cursor-zoom-in"
          aria-label={`${caption} 크게 보기`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(filename)}
            alt={caption}
            draggable={false}
            className="w-full h-full object-contain"
          />
          <span className="absolute top-2 left-2 rounded-md bg-neutral-900/80 px-2.5 py-1 text-base font-bold text-white">
            {caption}
          </span>
          <span className="absolute bottom-2 right-2 rounded-md bg-white/85 px-2 py-0.5 text-xs text-neutral-700 opacity-0 transition-opacity group-hover:opacity-100">
            눌러서 크게 보기
          </span>
        </button>
      ) : (
        <div className="aspect-video flex items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-500">
          {caption} 이미지를 불러오지 못했습니다
        </div>
      )}
      {badge && (
        <figcaption
          className={`self-start rounded-full px-3 py-1 text-sm font-semibold ${
            badgeTone === 'high' ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-800'
          }`}
        >
          {badge}
        </figcaption>
      )}
    </figure>
  )
}

// 답변이 사라지지 않도록 전체 화면을 덮어 상단 탭을 가린다.
export default function Interview({ photos, allEqual, pair, onSubmit }: InterviewProps) {
  const [answers, setAnswers] = useState<string[]>(INTERVIEW_QUESTIONS.map(() => ''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)
  const [zoomed, setZoomed] = useState<Zoomed | null>(null)

  const isFilled = answers.every((answer) => answer.trim().length > 0)
  const questions = INTERVIEW_QUESTIONS.map((q, i) => (i === 2 && allEqual ? INTERVIEW_Q3_ALL_EQUAL : q))

  useEffect(() => {
    const warnBeforeLeaving = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [])

  useEffect(() => {
    if (!zoomed) return
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(null)
    }
    window.addEventListener('keydown', closeOnEsc)
    return () => window.removeEventListener('keydown', closeOnEsc)
  }, [zoomed])

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => prev.map((answer, i) => (i === index ? value : answer)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isFilled || isSubmitting) return
    setIsSubmitting(true)
    setFailed(false)
    const saved = await onSubmit(answers.map((answer) => answer.trim()))
    if (!saved) {
      setFailed(true)
      setIsSubmitting(false)
    }
  }

  // 1~3번은 같은 사진을 같은 위치와 문자로 보여주고, 3번에서만 높고 낮음을 표시한다.
  function renderPhotoGrid(showGroup: boolean) {
    if (photos.length === 0) return null
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.filename}
            filename={photo.filename}
            caption={`사진 ${PHOTO_LETTERS[i]}`}
            badge={showGroup && !allEqual ? GROUP_LABEL[photo.group] : undefined}
            badgeTone={photo.group}
            onZoom={setZoomed}
          />
        ))}
      </div>
    )
  }

  function renderPhotos(index: number) {
    if (index === 0 || index === 1) return renderPhotoGrid(false)
    if (index === 2) return renderPhotoGrid(true)
    if (index === 3) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {pair.map((filename, i) => (
            <PhotoCard
              key={i}
              filename={filename}
              caption={`사진 ${PHOTO_LETTERS[i]}`}
              onZoom={setZoomed}
            />
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-6">
        <header>
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900">인터뷰</h2>
          <p className="text-lg text-neutral-600 mt-3">
            이미지를 본 경험을 떠올리며 각 문항에 자유롭게 적어주세요. 사진을 누르면 크게 볼 수
            있습니다.
            <br />
            구두 인터뷰를 했거나 적을 내용이 없으신 분은 &lsquo;없음&rsquo;으로 적고 맨 아래 완료 버튼을
            눌러주세요.
          </p>
        </header>

        {questions.map((question, index) => (
          <section key={index} className="card flex flex-col gap-4 p-6">
            <label htmlFor={`interview-${index}`} className="text-lg font-medium leading-relaxed text-neutral-900">
              {index + 1}. {question}
            </label>
            {renderPhotos(index)}
            <textarea
              id={`interview-${index}`}
              value={answers[index]}
              onChange={(e) => updateAnswer(index, e.target.value)}
              rows={4}
              maxLength={MAX_ANSWER_LENGTH}
              className="w-full resize-y border border-neutral-200 rounded-xl px-4 py-3 text-lg text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </section>
        ))}

        {failed && (
          <p className="text-red-600">답변을 저장하지 못했습니다. 다시 완료를 눌러주세요.</p>
        )}
        <div className="flex items-center justify-end gap-4">
          {!isFilled && (
            <p className="text-sm text-neutral-500">모든 문항을 작성하면 완료할 수 있습니다.</p>
          )}
          <button
            type="submit"
            disabled={!isFilled || isSubmitting}
            className="btn-primary px-10 py-3 text-lg font-semibold"
          >
            {isSubmitting ? '저장 중...' : '완료'}
          </button>
        </div>
      </form>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${zoomed.caption} 크게 보기`}
          onClick={() => setZoomed(null)}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/90 p-4 cursor-zoom-out"
        >
          {/* 원본 비율 그대로 화면에 맞춰 보여준다. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomed.src}
            alt={zoomed.caption}
            className="max-w-full max-h-[calc(100vh-5rem)] object-contain"
          />
          <p className="text-white text-lg font-semibold">
            {zoomed.caption} · 화면을 누르거나 ESC를 누르면 닫힙니다
          </p>
        </div>
      )}
    </div>
  )
}
