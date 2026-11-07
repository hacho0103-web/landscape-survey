export const RATING_QUESTIONS = [
  '이 길을 걷고 싶다.',
  '이 공간은 편안하게 느껴진다.',
  '이 거리의 전체적인 모습은 보기 좋다.',
]

export const RATING_SCALE = ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다']

export function isValidRating(values: unknown): values is number[] {
  return (
    Array.isArray(values) &&
    values.length === RATING_QUESTIONS.length &&
    values.every((v) => Number.isInteger(v) && v >= 1 && v <= RATING_SCALE.length)
  )
}
