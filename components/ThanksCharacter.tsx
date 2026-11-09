// 시작 화면에서는 울먹이며 부탁하고, 완료 화면에서는 웃으며 인사하는 캐릭터
type Mood = 'crying' | 'happy'

const IMAGES: Record<Mood, { src: string; alt: string }> = {
  crying: { src: '/chiikawa-crying.png', alt: '울먹이는 치이카와' },
  happy: { src: '/chiikawa-happy.png', alt: '웃는 치이카와' },
}

export default function ThanksCharacter({ mood, message }: { mood: Mood; message: string }) {
  const image = IMAGES[mood]
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4 rounded-2xl border-2 border-neutral-800 bg-white px-5 py-2.5 text-lg font-bold text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
        {message}
        <span
          aria-hidden
          className="absolute left-1/2 -bottom-[9px] h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-neutral-800 bg-white"
        />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        draggable={false}
        className={`h-36 w-auto rounded-2xl ${
          mood === 'happy'
            ? 'motion-safe:animate-[hop_1.2s_ease-in-out_infinite]'
            : 'motion-safe:animate-[sob_1.6s_ease-in-out_infinite]'
        }`}
      />
    </div>
  )
}
