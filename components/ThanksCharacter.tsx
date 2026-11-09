// 오리지널 캐릭터: 작은 건물. 시작 화면에서는 울먹이며 부탁하고, 완료 화면에서는 웃으며 인사한다.
type Mood = 'crying' | 'happy'

const STROKE = '#2b2b2b'

export default function ThanksCharacter({ mood, message }: { mood: Mood; message: string }) {
  const isHappy = mood === 'happy'
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-3 rounded-2xl border-2 border-neutral-800 bg-white px-5 py-2.5 text-lg font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
        {message}
        <span
          aria-hidden
          className="absolute left-1/2 -bottom-[9px] h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-neutral-800 bg-white"
        />
      </div>
      <svg
        viewBox="0 0 200 200"
        width="150"
        height="150"
        role="img"
        aria-label={isHappy ? '활짝 웃는 작은 건물 캐릭터' : '눈물을 흘리며 부탁하는 작은 건물 캐릭터'}
        className={
          isHappy
            ? 'motion-safe:animate-[hop_1.2s_ease-in-out_infinite]'
            : 'motion-safe:animate-[sob_1.6s_ease-in-out_infinite]'
        }
      >
        <ellipse cx="100" cy="190" rx="52" ry="6" fill="#000" opacity="0.08" />
        {/* 안테나 */}
        <line x1="100" y1="40" x2="100" y2="22" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="18" r="6" fill="#F4A7A3" stroke={STROKE} strokeWidth="3" />
        {/* 팔: 울 때는 축 처지고, 웃을 때는 번쩍 든다 */}
        {isHappy ? (
          <>
            <path d="M47 112 q-18 -10 -16 -34" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
            <path d="M153 112 q18 -10 16 -34" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M47 118 q-14 6 -18 20" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
            <path d="M153 118 q14 6 18 20" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        {/* 발 */}
        <rect x="68" y="174" width="20" height="12" rx="6" fill="#FBF6EE" stroke={STROKE} strokeWidth="3.5" />
        <rect x="112" y="174" width="20" height="12" rx="6" fill="#FBF6EE" stroke={STROKE} strokeWidth="3.5" />
        {/* 몸(건물) */}
        <rect x="45" y="40" width="110" height="140" rx="26" fill="#FBF6EE" stroke={STROKE} strokeWidth="4" />
        {[62, 90, 118].map((x) => (
          <rect key={x} x={x} y="56" width="20" height="16" rx="4" fill="#CFE3F2" stroke={STROKE} strokeWidth="3" />
        ))}
        {/* 볼 */}
        <ellipse cx="64" cy="126" rx="8" ry="5" fill="#F6A5A5" opacity="0.75" />
        <ellipse cx="136" cy="126" rx="8" ry="5" fill="#F6A5A5" opacity="0.75" />

        {isHappy ? (
          <>
            {/* 웃는 눈 */}
            <path d="M68 110 q9 -10 18 0" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
            <path d="M114 110 q9 -10 18 0" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" />
            {/* 활짝 웃는 입 */}
            <path d="M86 128 h28 q0 18 -14 18 q-14 0 -14 -18z" fill="#3a2a2a" stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
            <path d="M92 140 q8 -6 16 0 q-2 6 -8 6 q-6 0 -8 -6z" fill="#F08A8A" />
            {/* 반짝임 */}
            {[
              [30, 70],
              [170, 64],
              [176, 100],
            ].map(([x, y]) => (
              <path
                key={`${x}-${y}`}
                d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z`}
                fill="#F5C76B"
              />
            ))}
          </>
        ) : (
          <>
            {/* 질끈 감은 눈 */}
            <path d="M70 100 l14 7 l-14 7" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M130 100 l-14 7 l14 7" fill="none" stroke={STROKE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* 눈물 */}
            <path d="M79 116 q-7 15 0 24 q7 -9 0 -24z" fill="#8EC5F0" />
            <path d="M121 116 q-7 15 0 24 q7 -9 0 -24z" fill="#8EC5F0" />
            <path d="M34 84 q-4 8 0 12 q4 -4 0 -12z" fill="#8EC5F0" />
            <path d="M166 84 q-4 8 0 12 q4 -4 0 -12z" fill="#8EC5F0" />
            {/* 울먹이는 입 */}
            <path d="M88 138 q6 -6 12 0 q6 6 12 0" fill="none" stroke={STROKE} strokeWidth="3.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  )
}
