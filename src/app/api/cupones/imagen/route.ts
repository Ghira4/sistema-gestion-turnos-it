import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

export async function POST(req: NextRequest) {
  const { codigo, receptorNombre } = await req.json()

  const templatePath = path.join(process.cwd(), 'public', 'cupon-template.png')
  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 })
  }

  const texto = `${codigo}\n${receptorNombre}`

  const svgTexto = `
    <svg width="530" height="100" xmlns="http://www.w3.org/2000/svg">
      <text x="265" y="38" font-family="Arial, sans-serif" font-size="28" font-weight="bold"
        fill="#0f1b35" text-anchor="middle">${codigo}</text>
      <text x="265" y="72" font-family="Arial, sans-serif" font-size="20"
        fill="#0f1b35" text-anchor="middle">${receptorNombre}</text>
    </svg>
  `

  const imagen = await sharp(templatePath)
    .composite([{
      input: Buffer.from(svgTexto),
      top: 100,
      left: 710,
    }])
    .png()
    .toBuffer()

  return new NextResponse(new Uint8Array(imagen), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="cupon-${codigo}.png"`,
    },
  })
}
