import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'experiments.json')

interface Experiment {
  id: string
  label: string
  date: string
  imageOrder: string[]
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
  const { id } = await ctx.params
  const experiments = await readExperiments()
  const exp = experiments.find((e) => e.id === id)
  if (!exp) return Response.json({ error: '없음' }, { status: 404 })
  return Response.json(exp)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/experiments/[id]'>) {
  const { id } = await ctx.params
  const experiments = await readExperiments()
  const filtered = experiments.filter((e) => e.id !== id)
  if (filtered.length === experiments.length) {
    return Response.json({ error: '없음' }, { status: 404 })
  }
  await writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
  return Response.json({ deleted: id })
}
