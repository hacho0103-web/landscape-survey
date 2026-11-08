export const DEMOGRAPHICS_INTRO =
  '다음은 응답자의 일반적인 특성을 파악하기 위한 문항입니다. 해당하는 항목을 선택해 주십시오.'

export const OTHER_JOB = '기타'

export const GENDER_QUESTION = {
  question: '귀하의 성별은 무엇입니까?',
  options: ['남성', '여성', '기타 또는 응답하지 않음'],
}

export const AGE_QUESTION = '귀하의 연령은 어떻게 되십니까?'

export const JOB_QUESTION = {
  question: '귀하의 현재 직업은 무엇입니까?',
  options: ['학생', '직장인', '자영업자·프리랜서', OTHER_JOB],
}

export const EXPERIENCE_QUESTION = {
  question:
    '귀하는 건축·도시·조경·실내건축 등 관련 분야의 전공 또는 업무 경험이 있습니까? (여러 항목에 해당하면 가장 아래 항목을 선택해 주십시오.)',
  options: [
    '없음',
    '관련 분야 전공 중(학부·대학원)',
    '관련 분야 전공 졸업, 실무 경험 없음',
    '실무 경험 3년 미만',
    '실무 경험 3년 이상',
  ],
}

export const VISIT_QUESTION = {
  question: '귀하는 평소 대규모 업무·상업지구를 얼마나 자주 방문하십니까?',
  options: ['거의 방문하지 않음', '월 1회 미만', '월 1~3회 정도', '주 1~2회 정도', '주 3회 이상'],
}

export interface Demographics {
  gender: string
  age: number
  job: string
  jobOther?: string
  experience: string
  visitFrequency: string
}

const MAX_OTHER_LENGTH = 50

export function parseDemographics(value: unknown): Demographics | null {
  if (!value || typeof value !== 'object') return null
  const { gender, age, job, jobOther, experience, visitFrequency } = value as Record<
    string,
    unknown
  >

  const other = typeof jobOther === 'string' ? jobOther.trim() : ''
  const isValid =
    GENDER_QUESTION.options.includes(gender as string) &&
    Number.isInteger(age) &&
    (age as number) >= 1 &&
    (age as number) <= 120 &&
    JOB_QUESTION.options.includes(job as string) &&
    (job !== OTHER_JOB || (other.length > 0 && other.length <= MAX_OTHER_LENGTH)) &&
    EXPERIENCE_QUESTION.options.includes(experience as string) &&
    VISIT_QUESTION.options.includes(visitFrequency as string)
  if (!isValid) return null

  return {
    gender: gender as string,
    age: age as number,
    job: job as string,
    ...(job === OTHER_JOB ? { jobOther: other } : {}),
    experience: experience as string,
    visitFrequency: visitFrequency as string,
  }
}
