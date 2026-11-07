'use client'

import { RATING_QUESTIONS } from '@/lib/ratings'
import RatingPanel from './RatingPanel'

interface TutorialProps {
  imageCount: number
  onStart: () => void
  onCancel: () => void
}

const STEPS = (imageCount: number) => [
  `이미지가 한 장씩 나타납니다. 모두 ${imageCount}장입니다.`,
  '이미지를 보면서 오른쪽의 세 문항에 하나씩 응답하세요.',
  '오래 고민하지 말고 첫인상대로 선택하세요.',
  '세 문항에 모두 응답하면 다음 이미지로 넘어갈 수 있습니다. 시간제한은 없습니다.',
  '마지막 이미지까지 마치면 완료를 누르고, 이어서 인터뷰 문항에 답을 적어주세요.',
]

const markedControl =
  'px-4 py-1.5 text-sm text-white border border-white/30 rounded-md ring-2 ring-yellow-300'

// 하단 띠는 실제 실험과 같은 크기와 배치로 보여주어 버튼 위치를 그대로 익히게 한다.
export default function Tutorial({ imageCount, onStart, onCancel }: TutorialProps) {
  return (
    <>
      <div className="relative flex-1 min-h-0 flex">
      <div className="relative flex-1 min-w-0 flex flex-col">
        <img
          src="/tutorial-example.jpg"
          alt="예시 이미지"
          className="absolute inset-0 w-full h-full object-contain opacity-50"
        />

        <div className="relative flex-1 min-h-0 overflow-y-auto flex px-4 pt-4 pb-20">
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

            <div className="flex items-center justify-end gap-4 mt-5">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-[28px] text-white/70 hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onStart}
                autoFocus
                className="px-8 py-2 text-[28px] bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors"
              >
                실험 시작!
              </button>
            </div>
          </div>
        </div>

      </div>

      <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-white/10 p-6">
        <p className="text-2xl leading-tight text-yellow-300 mb-5">
          세 문항에 응답하고 아래 버튼이나 ←, → 키로 넘깁니다 ▼
        </p>
        <div className="rounded-lg p-3 ring-2 ring-yellow-300" aria-hidden="true">
          <RatingPanel values={RATING_QUESTIONS.map(() => null)} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <span className={markedControl}>← 이전</span>
            <span className={markedControl}>다음 →</span>
          </div>
        </div>
      </aside>

      <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-4 px-6 pb-2 pointer-events-none text-2xl leading-tight text-yellow-300 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]">
        <p>
          실험을 그만둘 때 누릅니다
          <br />▼
        </p>
        <p className="text-center">
          지금 보고 있는 이미지 번호입니다
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
        </div>
      </div>
    </>
  )
}
