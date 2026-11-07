'use client'

import { RATING_QUESTIONS, RATING_SCALE } from '@/lib/ratings'

interface RatingPanelProps {
  values: (number | null)[]
  onChange?: (questionIndex: number, value: number) => void
}

// onChange가 없으면 튜토리얼용 미리보기로 표시한다.
export default function RatingPanel({ values, onChange }: RatingPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-5 gap-1 text-center text-xs leading-tight text-white/60">
        {RATING_SCALE.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {RATING_QUESTIONS.map((question, questionIndex) => (
        <fieldset key={question} className="flex flex-col gap-2">
          <legend className="text-base text-white mb-2">{question}</legend>
          <div className="grid grid-cols-5 gap-1">
            {RATING_SCALE.map((label, scaleIndex) => {
              const value = scaleIndex + 1
              const isSelected = values[questionIndex] === value
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!onChange}
                  aria-label={`${question} ${label}`}
                  aria-pressed={isSelected}
                  onClick={() => onChange?.(questionIndex, value)}
                  className={`h-10 rounded-md border text-sm transition-colors ${
                    isSelected
                      ? 'bg-white border-white text-black font-semibold'
                      : 'border-white/25 text-white/70 enabled:hover:border-white/70 enabled:hover:text-white'
                  }`}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
