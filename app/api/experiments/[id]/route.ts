import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requireResearcher } from '@/lib/auth'
import { INTERVIEW_QUESTIONS, MAX_ANSWER_LENGTH } from '@/lib/interview'

const DATA_FILE = path.join(process.cwd(), 'public', 'uploads', '_data', 'experiments.json')

interface Experiment {
  id: string
  label: string
  date: string
  imageOrder: string[]
  viewTimes?: Record<string, number> // 이미지별 누적 관람 시간(ms)
  completed?: boolean // false면 ESC로 중단한 실험
  interviewAnswers?: string[] // INTERVIEW_QUESTIONS와 같은 순서
}

async function readExperiments(): Promise<Experiment[]> {
  try {
    if (!existsSync(DATA_FILE)) return []
    const raw = await readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function GET(_req: Request, ctx: RouteContext<'/api/experiments/[id]'>) {
  const denied = await requireResearcher()
  if (denied) return denied

  const { id } = await ctx.params
  const experiments = await readExperiments()
  const exp = experiments.find((e) => e.id === id)
  if (!exp) return Response.json({ error: '없음' }, { status: 404 })
  return Response.json(exp)
}

// 참가자가 실험을 마칠 때 호출하므로 인증을 요구하지 않는다.
// 대신 기록당 한 번만 저장할 수 있고 해당 실험의 이미지에 대한 값만 받는다.
export async function PATCH(req: Request, ctx: RouteContext<'/api/experiments/[id]'>) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => null)
  if (body?.interviewAnswers !== undefined) {
    return saveInterview(id, body.interviewAnswers)
  }

  const viewTimes = body?.viewTimes
  if (!viewTimes || typeof viewTimes !== 'object' || Array.isArray(viewTimes)) {
    return Response.json({ error: '관람 시간이 없습니다.' }, { status: 400 })
  }

  const experiments = await readExperiments()
  const exp = experiments.find((e) => e.id === id)
  if (!exp) return Response.json({ error: '없음' }, { status: 404 })
  if (exp.viewTimes) return Response.json({ error: '이미 저장되었습니다.' }, { status: 409 })

  const isValid = Object.entries(viewTimes).every(
    ([filename, ms]) =>
      exp.imageOrder.includes(filename) &&
      typeof ms === 'number' &&
      Number.isFinite(ms) &&
      ms >= 0
  )
  if (!isValid) {
    return Response.json({ error: '잘못된 관람 시간입니다.' }, { status: 400 })
  }

  exp.viewTimes = viewTimes
  exp.completed = body.completed === true
  await writeFile(DATA_FILE, JSON.stringify(experiments, null, 2), 'utf-8')
  return Response.json({ saved: id })
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
  if (!isValid) {
    return Response.json({ error: '잘못된 인터뷰 답변입니다.' }, { status: 400 })
  }

  const experiments = await readExperiments()
  const exp = experiments.find((e) => e.id === id)
  if (!exp) return Response.json({ error: '없음' }, { status: 404 })
  if (exp.interviewAnswers) {
    return Response.json({ error: '이미 저장되었습니다.' }, { status: 409 })
  }

  exp.interviewAnswers = answers
  await writeFile(DATA_FILE, JSON.stringify(experiments, null, 2), 'utf-8')
  return Response.json({ saved: id })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/experiments/[id]'>) {
  const denied = await requireResearcher()
  if (denied) return denied

  const { id } = await ctx.params
  const experiments = await readExperiments()
  const filtered = experiments.filter((e) => e.id !== id)
  if (filtered.length === experiments.length) {
    return Response.json({ error: '없음' }, { status: 404 })
  }
  await writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
  return Response.json({ deleted: id })
}
