import { NextRequest } from 'next/server'
import { writeFile, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { requireResearcher } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i

export async function GET() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      return Response.json({ images: [] })
    }
    const files = await readdir(UPLOAD_DIR)
    const images = files.filter((f) => IMAGE_EXTENSIONS.test(f)).sort()
    return Response.json({ images })
  } catch {
    return Response.json({ images: [] })
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireResearcher()
  if (denied) return denied

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return Response.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const saved: string[] = []
    for (const file of files) {
      if (!IMAGE_EXTENSIONS.test(file.name)) continue
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const dest = path.join(UPLOAD_DIR, file.name)
      await writeFile(dest, buffer)
      saved.push(file.name)
    }

    return Response.json({ saved })
  } catch (e) {
    console.error(e)
    return Response.json({ error: '업로드 실패' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireResearcher()
  if (denied) return denied

  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    const body = filename ? null : await req.json().catch(() => null)
    const filenames: unknown = filename ? [filename] : body?.filenames
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return Response.json({ error: '파일명이 없습니다.' }, { status: 400 })
    }

    const deleted: string[] = []
    const failed: string[] = []
    for (const name of filenames) {
      // Prevent path traversal
      const safe = path.basename(String(name))
      try {
        await unlink(path.join(UPLOAD_DIR, safe))
        deleted.push(safe)
      } catch {
        failed.push(safe)
      }
    }

    return Response.json({ deleted, failed }, { status: deleted.length > 0 ? 200 : 500 })
  } catch {
    return Response.json({ error: '삭제 실패' }, { status: 500 })
  }
}
