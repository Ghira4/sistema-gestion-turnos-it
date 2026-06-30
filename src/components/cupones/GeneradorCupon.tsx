'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generarCodigo } from '@/lib/cupones'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Send, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function GeneradorCupon({ emisorNombre, emisorId }: { emisorNombre: string; emisorId: string }) {
  const router = useRouter()
  const [receptorNombre, setReceptorNombre] = useState('')
  const [receptorContacto, setReceptorContacto] = useState('')
  const [cuponGenerado, setCuponGenerado] = useState<{ id: string; codigo: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function handleGenerar(e: React.FormEvent) {
    e.preventDefault()
    if (!receptorNombre) { toast.error('Ingresá el nombre del receptor'); return }
    setLoading(true)

    const codigo = generarCodigo(emisorNombre, receptorNombre)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cupones')
      .insert({
        codigo,
        emisor_id: emisorId,
        receptor_nombre: receptorNombre,
        receptor_contacto: receptorContacto,
        canjeado: false,
      })
      .select('id, codigo')
      .single()

    if (error) { toast.error('Error al generar el cupón'); setLoading(false); return }

    setCuponGenerado(data)
    setLoading(false)
    toast.success('¡Cupón generado!')
  }

  function handleDescargar() {
    if (!cuponGenerado) return
    window.open(`/api/cupones/imagen?codigo=${cuponGenerado.codigo}`, '_blank')
  }

  function handleWhatsApp() {
    if (!cuponGenerado || !receptorContacto) {
      toast.error('Ingresá el contacto del receptor para enviar por WhatsApp')
      return
    }
    const numero = receptorContacto.replace(/\D/g, '')
    const mensaje = encodeURIComponent(
      `¡Hola ${receptorNombre}! 🎉 Te enviamos tu cupón de descuento del 40% de Turnos IT.\n\nTu código es: *${cuponGenerado.codigo}*\n\nEnvialo por este mismo WhatsApp para aplicar el descuento en tu próximo turno.`
    )
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
  }

  async function handleCopiar() {
    if (!cuponGenerado) return
    await navigator.clipboard.writeText(cuponGenerado.codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function handleNuevo() {
    setCuponGenerado(null)
    setReceptorNombre('')
    setReceptorContacto('')
  }

  if (cuponGenerado) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base text-green-700">✓ Cupón generado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Código</p>
            <p className="font-mono text-2xl font-black tracking-widest">{cuponGenerado.codigo}</p>
            <p className="text-sm text-muted-foreground mt-1">Para: {receptorNombre}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleCopiar} className="gap-2">
              {copiado ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </Button>
            <Button variant="outline" onClick={handleDescargar} className="gap-2">
              <Download className="w-4 h-4" />
              Descargar
            </Button>
          </div>

          <Button onClick={handleWhatsApp} className="w-full gap-2 bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4" />
            Enviar por WhatsApp
          </Button>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleNuevo} className="flex-1">
              Generar otro
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/cupones')} className="flex-1">
              Ver mis cupones
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleGenerar} className="max-w-md space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Datos del receptor</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre completo *</Label>
            <Input
              value={receptorNombre}
              onChange={e => setReceptorNombre(e.target.value)}
              placeholder="Juan Pérez"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp / contacto</Label>
            <Input
              value={receptorContacto}
              onChange={e => setReceptorContacto(e.target.value)}
              placeholder="+549..."
            />
            <p className="text-xs text-muted-foreground">Necesario para enviar el cupón por WhatsApp</p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Generando...' : 'Generar cupón'}
      </Button>
    </form>
  )
}
