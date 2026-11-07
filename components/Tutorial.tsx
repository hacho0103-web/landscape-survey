'use client'

interface TutorialProps {
  imageCount: number
  isStarting: boolean
  hasError: boolean
  onStart: () => void
  onCancel: () => void
}

const STEPS = (imageCount: number) => [
  `이미지가 한 장씩 나타납니다. 모두 ${imageCount}장입니다.`,
  '화면 아래의 이미지 번호를 확인하고, 평가지에서 같은 번호의 세 문항을 찾으세요.',
  '오래 고민하지 말고 첫인상대로 해당하는 칸에 표시하세요.',
  '표시를 마치면 다음 이미지로 넘어가세요. 시간제한은 없습니다.',
  '마지막 이미지까지 마치면 완료를 누르고, 이어서 간단한 인터뷰를 진행합니다.',
]

const markedControl = 'px-4 py-1.5 text-sm text-white border border-white/30 rounded-md ring-2 ring-yellow-300'

// 실제 실험 화면과 같은 배치로 보여주어 버튼 위치를 그대로 익히게 한다.
export default function Tutorial({
  imageCount,
  isStarting,
  hasError,
  onStart,
  onCancel,
}: TutorialProps) {
  return (
    <>
      <div className="relative flex-1 min-h-0 flex flex-col">
        <img
          src="/tutorial-example.svg"
          alt="예시 이미지"
          className="absolute inset-0 w-full h-full object-contain opacity-40"
        />

        <div className="relative flex-1 min-h-0 overflow-y-auto flex p-6">
          <div className="m-auto w-full max-w-xl bg-black/75 text-white rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">실험 방법</h2>
            <ol className="flex flex-col gap-2 text-sm leading-relaxed list-decimal pl-5">
              {STEPS(imageCount).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-xs text-white/60 mt-4">
              뒤의 사진은 예시이며 실제 평가 대상이 아닙니다.
            </p>
            {hasError && (
              <p className="text-sm text-red-300 mt-3">
                실험 기록을 만들지 못했습니다. 다시 시도해주세요.
              </p>
            )}
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={onCancel}
                disabled={isStarting}
                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={onStart}
                disabled={isStarting}
                autoFocus
                className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {isStarting ? '준비 중...' : '실험 시작!'}
              </button>
            </div>
          </div>
        </div>

        <div className="relative shrink-0 grid grid-cols-3 gap-4 px-6 pb-2 text-xs text-yellow-300">
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
