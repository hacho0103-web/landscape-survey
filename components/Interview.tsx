'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { INTERVIEW_QUESTIONS, MAX_ANSWER_LENGTH } from '@/lib/interview'

interface InterviewProps {
  onSubmit: (answers: string[]) => Promise<boolean>
}

// 답변이 사라지지 않도록 전체 화면을 덮어 상단 탭을 가린다.
export default function Interview({ onSubmit }: InterviewProps) {
  const [answers, setAnswers] = useState<string[]>(INTERVIEW_QUESTIONS.map(() => ''))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)

  const isFilled = answers.every((answer) => answer.trim().length > 0)

  useEffect(() => {
    const warnBeforeLeaving = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [])

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-6">
        <header>
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900">인터뷰</h2>
          <p className="text-lg text-neutral-600 mt-3">
            이미지를 본 경험을 떠올리며 각 문항에 자유롭게 적어주세요.
            <br />
            구두 인터뷰를 했거나 적을 내용이 없으신 분은 &lsquo;없음&rsquo;으로 적고 맨 아래 완료 버튼을
            눌러주세요.
          </p>
        </header>

        {INTERVIEW_QUESTIONS.map((question, index) => (
          <label key={question} className="card flex flex-col gap-4 p-6">
            <span className="text-lg font-medium leading-relaxed text-neutral-900">
              {index + 1}. {question}
            </span>
            <textarea
              value={answers[index]}
              onChange={(e) => updateAnswer(index, e.target.value)}
              rows={4}
              maxLength={MAX_ANSWER_LENGTH}
              className="w-full resize-y border border-neutral-200 rounded-xl px-4 py-3 text-lg text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </label>
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
    </div>
  )
}
