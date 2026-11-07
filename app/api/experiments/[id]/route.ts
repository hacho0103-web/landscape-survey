import { requireResearcher } from '@/lib/auth'
import { readExperiments, updateExperiments, type Experiment } from '@/lib/experiments'
import { INTERVIEW_QUESTIONS, MAX_ANSWER_LENGTH } from '@/lib/interview'
import { isValidRating } from '@/lib/ratings'

export async function GET(_req: Request, ctx: RouteContext<'/api/experiments/[id]'>) {
  const denied = await requireResearcher()
  if (denied) return denied

  const { id } = await ctx.params
  const experiments = await readExperiments()
  const exp = experiments.find((e) => e.id === id)
  if (!exp) return Response.json({ error: '없음' }, { status: 404 })
  return Response.json(exp)
}

function notFound() {
  return Response.json({ error: '없음' }, { status: 404 })
}

function alreadySaved() {
  return Response.json({ error: '이미 저장되었습니다.' }, { status: 409 })
}

function invalid(error: string) {
  return Response.json({ error }, { status: 400 })
}

function hasValidRatings(exp: Experiment, ratings: Record<string, unknown>) {
  return Object.entries(ratings).every(
    ([filename, values]) => exp.imageOrder.includes(filename) && isValidRating(values)
  )
}

// 참가자가 실험 중에 호출하므로 인증을 요구하지 않는다.
// 대신 해당 실험의 이미지에 대한 값만 받고, 실험이 끝난 기록은 고칠 수 없다.
export async function PATCH(req: Request, ctx: RouteContext<'/api/experiments/[id]'>) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)

  try {
    if (body?.interviewAnswers !== undefined) return await saveInterview(id, body.interviewAnswers)
    if (body?.rating !== undefined) return await saveRating(id, body.rating)
    return await saveResult(id, body)
  } catch (e) {
    console.error(e)
    return Response.json({ error: '저장 실패' }, { status: 500 })
  }
}

async function saveRating(id: string, rating: { filename?: unknown; values?: unknown } | null) {
  const filename = rating?.filename
  const values = rating?.values
  if (typeof filename !== 'string' || !isValidRating(values)) {
    return invalid('잘못된 응답입니다.')
  }

  return updateExperiments((experiments) => {
    const exp = experiments.find((e) => e.id === id)
    if (!exp) return notFound()
    if (exp.viewTimes) return alreadySaved()
    if (!exp.imageOrder.includes(filename)) return invalid('잘못된 응답입니다.')

    exp.ratings = { ...exp.ratings, [filename]: values }
    return Response.json({ saved: id })
  })
}

async function saveResult(
  id: string,
  body: { viewTimes?: unknown; ratings?: unknown; completed?: unknown } | null
) {
  const viewTimes = body?.viewTimes
  const ratings = body?.ratings ?? {}
  if (!viewTimes || typeof viewTimes !== 'object' || Array.isArray(viewTimes)) {
    return invalid('관람 시간이 없습니다.')
  }
  if (typeof ratings !== 'object' || Array.isArray(ratings)) {
    return invalid('잘못된 응답입니다.')
  }

  return updateExperiments((experiments) => {
    const exp = experiments.find((e) => e.id === id)
    if (!exp) return notFound()
    if (exp.viewTimes) return alreadySaved()

    const hasValidTimes = Object.entries(viewTimes).every(
      ([filename, ms]) =>
        exp.imageOrder.includes(filename) &&
        typeof ms === 'number' &&
        Number.isFinite(ms) &&
        ms >= 0
    )
    if (!hasValidTimes) return invalid('잘못된 관람 시간입니다.')
    if (!hasValidRatings(exp, ratings as Record<string, unknown>)) {
      return invalid('잘못된 응답입니다.')
    }

    exp.viewTimes = viewTimes as Record<string, number>
    exp.ratings = { ...exp.ratings, ...(ratings as Record<string, number[]>) }
    exp.completed = body?.completed === true
    return Response.json({ saved: id })
  })
}

async function saveInterview(id: string, answers: unknown) {
  const isValid =
    Array.isArray(answers) &&
    answers.length === INTERVIEW_QUESTIONS.length &&
    answers.every(
      (answer) =>
        typeof answer === 'string' &&
        answer.trim().length > 0 &&
        answer.length <= MAX_ANSWER_LENGTH
    )
  if (!isValid) return invalid('잘못된 인터뷰 답변입니다.')

  return updateExperiments((experiments) => {
    const exp = experiments.find((e) => e.id === id)
    if (!exp) return notFound()
    if (exp.interviewAnswers) return alreadySaved()

    exp.interviewAnswers = answers as string[]
    return Response.json({ saved: id })
  })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/experiments/[id]'>) {
  const denied = await requireResearcher()
  if (denied) return denied

  const { id } = await ctx.params
  return updateExperiments((experiments) => {
    const index = experiments.findIndex((e) => e.id === id)
    if (index === -1) return notFound()
    experiments.splice(index, 1)
    return Response.json({ deleted: id })
  })
}
