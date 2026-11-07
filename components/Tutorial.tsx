'use client'

import { useState, type FormEvent } from 'react'

interface TutorialProps {
  imageCount: number
  isStarting: boolean
  error: string | null
  onStart: (participantId: string) => void
  onCancel: () => void
}

const STEPS = (imageCount: number) => [
  `이미지가 한 장씩 나타납니다. 모두 ${imageCount}장입니다.`,
  '화면 아래의 이미지 번호를 확인하고, 평가지에서 같은 번호의 세 문항을 찾으세요.',
  '오래 고민하지 말고 첫인상대로 해당하는 칸에 표시하세요.',
  '표시를 마치면 다음 이미지로 넘어가세요. 시간제한은 없습니다.',
  '마지막 이미지까지 마치면 완료를 누르고, 이어서 인터뷰 문항에 답을 적어주세요.',
]

const markedControl =
  'px-4 py-1.5 text-sm text-white border border-white/30 rounded-md ring-2 ring-yellow-300'

// 하단 띠는 실제 실험과 같은 크기와 배치로 보여주어 버튼 위치를 그대로 익히게 한다.
export default function Tutorial({
  imageCount,
  isStarting,
  error,
  onStart,
  onCancel,
}: TutorialProps) {
  const [participantId, setParticipantId] = useState('')
  const canStart = participantId.trim().length > 0 && !isStarting

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (canStart) onStart(participantId.trim())
  }

  return (
    <>
      <div className="relative flex-1 min-h-0 flex flex-col">
        <img
          src="/tutorial-example.jpg"
          alt="예시 이미지"
          className="absolute inset-0 w-full h-full object-contain opacity-50"
        />

        <div className="relative flex-1 min-h-0 overflow-y-auto flex p-4">
          <div className="m-auto w-full max-w-6xl bg-black/80 text-white rounded-xl px-8 py-6">
            <h2 className="text-[40px] font-bold mb-3">실험 방법</h2>
            <ol className="flex flex-col gap-1 text-[28px] leading-snug list-decimal pl-10">
              {STEPS(imageCount).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-2xl text-white/60 mt-3">
              뒤의 사진은 예시이며 실제 평가 대상이 아닙니다.
            </p>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex flex-1 items-center gap-4 text-[28px] font-semibold">
                  <span className="shrink-0">실험자 고유 번호</span>
                  <input
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value)}
                    maxLength={30}
                    autoFocus
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-white text-black font-normal rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </label>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isStarting}
                  className="px-4 py-2 text-[28px] text-white/70 hover:text-white transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!canStart}
                  className="px-8 py-2 text-[28px] bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40"
                >
                  {isStarting ? '준비 중...' : '실험 시작!'}
                </button>
              </div>
              {error && <p className="text-[28px] text-red-300 mt-3">{error}</p>}
            </form>
          </div>
        </div>

        <div className="relative shrink-0 grid grid-cols-3 gap-4 px-6 pb-2 text-2xl leading-tight text-yellow-300 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
          <p>
            실험을 그만둘 때 누릅니다
            <br />▼
          </p>
          <p className="text-center">
            평가지와 맞춰 볼 이미지 번호입니다
            <br />▼
          </p>
          <p className="text-right">
            버튼이나 ←, → 키로 이미지를 넘깁니다
            <br />▼
          </p>
        </div>
      </div>

      <div className="shrink-0" aria-hidden="true">
        <div className="h-0.5 bg-white/10" />
        <div className="h-12 px-6 grid grid-cols-3 items-center">
          <span className={`${markedControl} justify-self-start`}>나가기</span>
          <span className="text-sm font-semibold text-white justify-self-center rounded-md px-3 py-1 ring-2 ring-yellow-300">
            이미지 1 / {imageCount}
          </span>
          <div className="flex gap-2 justify-self-end">
            <span className={markedControl}>← 이전</span>
            <span className={markedControl}>다음 →</span>
          </div>
        </div>
      </div>
    </>
  )
}
