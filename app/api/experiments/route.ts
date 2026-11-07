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
    const { imageOrder } = body as { imageOrder: string[] }

    if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
      return Response.json({ error: '이미지 순서가 없습니다.' }, { status: 400 })
    }

    const experiments = await readExperiments()
    // 일부 기록을 지워도 번호가 겹치지 않도록 남은 기록의 최대 번호 다음을 쓴다.
    const index =
      Math.max(0, ...experiments.map((e) => Number(e.label.replace(/\D/g, '')) || 0)) + 1

    const newExp: Experiment = {
      id: `exp_${Date.now()}`,
      label: `실험 ${index}`,
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
