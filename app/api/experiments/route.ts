import { NextRequest } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requireResearcher } from '@/lib/auth'

const DATA_DIR = path.join(process.cwd(), 'public', 'uploads', '_data')
const DATA_FILE = path.join(DATA_DIR, 'experiments.json')

interface Experiment {
  id: string
  label: string
  date: string
  imageOrder: string[]
  viewTimes?: Record<string, number>
  completed?: boolean
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

async function writeExperiments(experiments: Experiment[]) {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
  await writeFile(DATA_FILE, JSON.stringify(experiments, null, 2), 'utf-8')
}

export async function GET() {
  const denied = await requireResearcher()
  if (denied) return denied

  const experiments = await readExperiments()
  return Response.json(experiments)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imageOrder, participantId } = body as {
      imageOrder: string[]
      participantId: unknown
    }
    const label = typeof participantId === 'string' ? participantId.trim() : ''

    if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
      return Response.json({ error: '이미지 순서가 없습니다.' }, { status: 400 })
    }
    if (!label || label.length > 30) {
      return Response.json({ error: '실험자 고유 번호가 없습니다.' }, { status: 400 })
    }

    const experiments = await readExperiments()
    // 다른 사람의 결과와 섞이지 않게 완료된 번호는 막고, 중단한 번호는 다시 쓸 수 있게 둔다.
    if (experiments.some((e) => e.label === label && e.completed === true)) {
      return Response.json({ error: '이미 완료된 번호입니다.' }, { status: 409 })
    }

    const newExp: Experiment = {
      id: `exp_${Date.now()}`,
      label,
      date: new Date().toISOString(),
      imageOrder,
    }

    experiments.push(newExp)
    await writeExperiments(experiments)

    return Response.json(newExp)
  } catch (e) {
    console.error(e)
    return Response.json({ error: '저장 실패' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireResearcher()
  if (denied) return denied

  try {
    const body = await req.json().catch(() => null)
    const ids = body?.ids
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: '삭제할 기록이 없습니다.' }, { status: 400 })
    }

    const targets = new Set(ids)
    const experiments = await readExperiments()
    const remaining = experiments.filter((e) => !targets.has(e.id))
    await writeExperiments(remaining)

    return Response.json({ deleted: experiments.length - remaining.length })
  } catch (e) {
    console.error(e)
    return Response.json({ error: '삭제 실패' }, { status: 500 })
  }
}
