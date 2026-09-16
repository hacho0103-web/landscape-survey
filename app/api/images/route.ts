import { NextRequest } from 'next/server'
import { writeFile, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

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
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    if (!filename) {
      return Response.json({ error: '파일명이 없습니다.' }, { status: 400 })
    }

    // Prevent path traversal
    const safe = path.basename(filename)
    const filePath = path.join(UPLOAD_DIR, safe)
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return Response.json({ error: '잘못된 경로입니다.' }, { status: 400 })
    }

    await unlink(filePath)
    return Response.json({ deleted: safe })
  } catch {
    return Response.json({ error: '삭제 실패' }, { status: 500 })
  }
}
