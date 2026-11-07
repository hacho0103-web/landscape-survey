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
                  aria-pressed={isSelected}
                  onClick={() => onChange?.(questionIndex, value)}
                  className={`h-16 px-1 rounded-md border text-sm leading-tight transition-colors ${
                    isSelected
                      ? 'bg-white border-white text-black font-semibold'
                      : 'border-white/30 text-white/85 enabled:hover:border-white/80 enabled:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
