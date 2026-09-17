import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const safe = path.basename(decodeURIComponent(filename))
  const filePath = path.join(UPLOAD_DIR, safe)

  if (!filePath.startsWith(UPLOAD_DIR) || !existsSync(filePath)) {
    return new Response('Not found', { status: 404 })
  }

  const ext = safe.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME[ext] ?? 'application/octet-stream'
  const buffer = await readFile(filePath)

  return new Response(buffer, {
    headers: { 'Content-Type': contentType },
  })
}
