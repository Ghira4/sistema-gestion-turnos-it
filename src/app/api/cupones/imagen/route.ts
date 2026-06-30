import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

// Posición del rectángulo dorado en la imagen template (1333x889px aprox)
// Ajustá estos valores si el texto no cae exactamente en el rectángulo
const RECT = {
  x: 710,      // left edge del rectángulo
  y: 100,      // top edge del rectángulo
  width: 530,  // ancho del rectángulo
  height: 100, // alto del rectángulo
}

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo')
  if (!codigo) return NextResponse.json({ error: 'Falta el código' }, { status: 400 })

  const templatePath = path.join(process.cwd(), 'public', 'cupon-template.png')

  if (!fs.existsSync(templatePath)) {
    return NextResponse.json({ error: 'Template no encontrada' }, { status: 404 })
  }

  // Calcular tamaño de fuente para que entre en el rectángulo
  const fontSize = Math.min(48, Math.floor(RECT.height * 0.55))

  // SVG con el texto del código centrado en el rectángulo
  const svgText = `
    <svg width="${RECT.width}" height="${RECT.height}">
      <style>
        text {
          font-family: 'Arial Black', Arial, sans-serif;
          font-weight: 900;
          letter-spacing: 3px;
        }
      </style>
      <text
        x="50%"
        y="60%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${fontSize}"
        fill="#1a1a2e"
      >${codigo}</text>
    </svg>
  `

  const svgBuffer = Buffer.from(svgText)

  const imagen = await sharp(templatePath)
    .composite([{
      input: svgBuffer,
      left: RECT.x,
      top: RECT.y,
    }])
    .png()
    .toBuffer()

  return new NextResponse(new Uint8Array(imagen), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="cupon-${codigo}.png"`,
      'Cache-Control': 'no-store',
    },
  })
}
