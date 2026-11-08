export const INTERVIEW_QUESTIONS = [
  '앞에서 본 거리 사진들을 떠올려 보면, 어떤 느낌이 가장 기억에 남나요? 아래 사진을 참고해 단어나 짧은 표현 두세 개로 말씀해 주세요.',
  '이 사진들 중 처음 봤을 때 눈에 띄었던 장면이 있나요? 어느 사진의 어떤 부분이 먼저 눈에 들어왔는지 말씀해 주세요.',
  '높게 평가한 사진과 낮게 평가한 사진을 하나씩 골라 주세요. 두 거리의 어떤 점이 점수를 다르게 주는 데 영향을 줬나요?',
  '두 사진 속 거리의 느낌은 비슷했나요, 달랐나요? 그렇게 느끼게 한 부분을 사진에서 짚어 말씀해 주세요.',
]

// 참가자가 모든 사진을 같은 점수로 평가해 높고 낮음을 나눌 수 없을 때 3번 대신 보여준다.
export const INTERVIEW_Q3_ALL_EQUAL =
  '아래 사진들을 모두 비슷한 점수로 평가하셨습니다. 사진들을 비슷하게 평가한 이유는 무엇인가요? 사진에서 짚어 말씀해 주세요.'

// 4문항으로 바꾸기 전 기록을 연구자 화면에서 읽을 수 있게 남겨둔다.
export const LEGACY_INTERVIEW_QUESTIONS = [
  '앞에서 본 거리 사진들을 떠올려 보세요. 전체적으로 어떤 느낌이 들었나요? 생각나는 단어를 두세 개 적어 주세요.',
  '사진을 볼 때 어디에 가장 먼저 눈이 갔나요?',
  "앞에서 답한 세 질문 '걷고 싶다', '편안하다', '보기 좋다'는 서로 다른 내용으로 느껴졌나요, 아니면 비슷하게 느껴졌나요?",
  '걷고 싶었던 거리와 걷고 싶지 않았던 거리는 무엇이 달랐나요?',
  '건물에 둘러싸인 느낌이 드는 사진이 있었나요? 있었다면 그 느낌이 답답했나요, 편안했나요?',
  '건물 모양은 같고 재료나 색만 다른 사진들이 있었습니다. 이때 거리의 느낌도 다르게 느껴졌나요?',
]

export const MAX_ANSWER_LENGTH = 5000

// 4번 고정 비교쌍: 치수안 P, 일반도로(파일명에 M이 붙지 않은 P_) 사진
// 사진 A = 외관 03 적갈색 벽돌형, 사진 B = 외관 07 물결 유리·백색 프레임형
export const COMPARISON_PAIR = ['P_적갈색 벽돌.png', 'P_물결 유리 백색 프레임.png']

export const PHOTO_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const PER_GROUP = 3

// 신뢰도 확인용으로 한 번 더 보여준 사진. 원본과 같은 사진이 두 번 뽑히지 않도록 후보에서 뺀다.
const DUPLICATE_MARK = ' 복사본'

export type PhotoGroup = 'high' | 'low'

export interface ScoredImage {
  filename: string
  mean: number // 반올림하지 않은 세 문항 평균
  group: PhotoGroup
}

export interface InterviewSelection {
  images: ScoredImage[] // 상위부터 하위 순
  allEqual: boolean
}

function sameName(a: string, b: string) {
  return a.normalize('NFC') === b.normalize('NFC')
}

export function findImage(images: string[], filename: string) {
  return images.find((image) => sameName(image, filename))
}

export function meanRating(values: number[] | undefined) {
  if (!values || values.length === 0) return undefined
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

// 평균이 높은 순, 같으면 이미지 ID(파일명) 순으로 한 줄로 세운 뒤
// 앞의 3장을 상위, 뒤의 3장을 하위로 고른다. 한 줄에서 나누므로 같은 사진이 양쪽에 들어가지 않는다.
export function selectInterviewImages(
  imageOrder: string[],
  ratings: Record<string, number[]> | undefined
): InterviewSelection {
  const scored = imageOrder
    .filter((filename) => !filename.normalize('NFC').includes(DUPLICATE_MARK))
    .map((filename) => ({ filename, mean: meanRating(ratings?.[filename]) }))
    .filter((item): item is { filename: string; mean: number } => item.mean !== undefined)
    .sort((a, b) => {
      if (b.mean !== a.mean) return b.mean - a.mean
      const idA = a.filename.normalize('NFC')
      const idB = b.filename.normalize('NFC')
      return idA < idB ? -1 : idA > idB ? 1 : 0
    })

  const count = Math.min(PER_GROUP, Math.floor(scored.length / 2))
  const high = scored.slice(0, count).map((item) => ({ ...item, group: 'high' as const }))
  const low = scored
    .slice(scored.length - count)
    .map((item) => ({ ...item, group: 'low' as const }))
  const images = [...high, ...low]
  const allEqual = images.length > 0 && images[0].mean === images[images.length - 1].mean
  return { images, allEqual }
}

export interface LabeledImage {
  letter: string
  filename: string
  mean: number | undefined
  group: PhotoGroup | undefined
}

// 저장된 A~F 순서에 서버에 저장된 점수로 평균과 높음·낮음을 다시 붙인다.
export function describeInterviewImages(record: {
  imageOrder: string[]
  ratings?: Record<string, number[]>
  interviewImages?: string[]
}): { images: LabeledImage[]; allEqual: boolean } {
  const selection = selectInterviewImages(record.imageOrder, record.ratings)
  const images = (record.interviewImages ?? []).map((filename, i) => ({
    letter: PHOTO_LETTERS[i],
    filename,
    mean: meanRating(record.ratings?.[filename]),
    group: selection.images.find((item) => item.filename === filename)?.group,
  }))
  return { images, allEqual: selection.allEqual }
}

export function interviewQuestionsFor(answerCount: number, allEqual: boolean) {
  if (answerCount === LEGACY_INTERVIEW_QUESTIONS.length) return LEGACY_INTERVIEW_QUESTIONS
  return INTERVIEW_QUESTIONS.map((q, i) => (i === 2 && allEqual ? INTERVIEW_Q3_ALL_EQUAL : q))
}
