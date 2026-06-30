'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import EstadoBadge from '@/components/turnos/EstadoBadge'
import OrigenBadge from '@/components/turnos/OrigenBadge'
import { ArrowLeft, Download, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Turno } from '@/types'

const ESTADOS = ['pendiente', 'confirmado', 'rechazado', 'listo', 'abonado']

export default function DetalleTurnoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [turno, setTurno] = useState<Turno | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [fechaConfirmacion, setFechaConfirmacion] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('turnos')
        .select('*, consulado:consulados(nombre, ciudad, pais), cupon:cupones(codigo, emisor:profiles(full_name))')
        .eq('id', id)
        .single()
      if (data) {
        setTurno(data as Turno)
        setNuevoEstado(data.estado)
        setFechaConfirmacion(data.fecha_confirmacion ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function guardarCambios() {
    if (!turno) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('turnos')
      .update({
        estado: nuevoEstado,
        fecha_confirmacion: fechaConfirmacion || null,
      })
      .eq('id', turno.id)

    if (error) { toast.error('Error al guardar'); setSaving(false); return }
    setTurno(prev => prev ? { ...prev, estado: nuevoEstado as Turno['estado'], fecha_confirmacion: fechaConfirmacion } : prev)
    toast.success('Turno actualizado')
    setSaving(false)
  }

  async function getArchivoUrl(path: string) {
    const supabase = createClient()
    const { data } = supabase.storage.from('archivos-turnos').getPublicUrl(path)
    window.open(data.publicUrl, '_blank')
  }

  if (loading) return <div className="text-center text-muted-foreground py-12 text-sm">Cargando...</div>
  if (!turno) return <div className="text-center text-muted-foreground py-12 text-sm">Turno no encontrado</div>

  const whatsappUrl = turno.cliente_contacto
    ? `https://wa.me/${turno.cliente_contacto.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(turno.cliente_nombre)}%2C%20te%20contactamos%20de%20Turnos%20IT.`
    : null

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/turnos')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{turno.cliente_nombre}</h1>
          <p className="text-sm text-muted-foreground">Ficha del turno</p>
        </div>
      </div>

      {/* Estado y badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <EstadoBadge estado={turno.estado} />
        <OrigenBadge origen={turno.origen} />
        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{turno.tipo}</span>
      </div>

      {/* Info consulado */}
      <Card>
        <CardHeader><CardTitle className="text-base">Consulado</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          {turno.consulado && (
            <>
              <p className="font-medium">{turno.consulado.nombre}</p>
              <p className="text-muted-foreground">{turno.consulado.ciudad}, {turno.consulado.pais}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info cliente */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Nombre</p>
              <p className="font-medium">{turno.cliente_nombre}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Contacto</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{turno.cliente_contacto || '—'}</p>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </a>
                )}
              </div>
            </div>
          </div>
          {turno.datos_adicionales && Object.keys(turno.datos_adicionales).length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Datos adicionales</p>
              <p className="bg-muted rounded p-2 text-sm">{turno.datos_adicionales.notas ?? JSON.stringify(turno.datos_adicionales)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Precios y cupón */}
      <Card>
        <CardHeader><CardTitle className="text-base">Precio y cupón</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Precio original</p>
              <p className="font-medium">{turno.precio_original.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Precio final</p>
              <p className="font-semibold text-green-700">{turno.precio_final.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p>
            </div>
          </div>
          {turno.cupon && (
            <div className="mt-2 bg-muted rounded p-2">
              <p className="text-xs text-muted-foreground">Cupón aplicado</p>
              <p className="font-mono font-medium">{turno.cupon.codigo}</p>
              {turno.cupon.emisor && (
                <p className="text-xs text-muted-foreground">Generado por: {turno.cupon.emisor.full_name}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fechas */}
      <Card>
        <CardHeader><CardTitle className="text-base">Fechas</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Fecha solicitud</p>
              <p>{turno.fecha_solicitud ? new Date(turno.fecha_solicitud + 'T00:00:00').toLocaleDateString('es-AR') : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Fecha del turno</p>
              <p>{turno.fecha_turno ? new Date(turno.fecha_turno + 'T00:00:00').toLocaleDateString('es-AR') : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar estado */}
      <Card>
        <CardHeader><CardTitle className="text-base">Actualizar estado</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={nuevoEstado} onValueChange={(v) => v && setNuevoEstado(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map(e => (
                    <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha confirmación</Label>
              <Input type="date" value={fechaConfirmacion} onChange={e => setFechaConfirmacion(e.target.value)} />
            </div>
          </div>
          <Button onClick={guardarCambios} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardContent>
      </Card>

      {/* Archivos */}
      {(turno.archivos?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Archivos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {turno.archivos!.map((path, i) => (
              <button
                key={i}
                onClick={() => getArchivoUrl(path)}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Download className="w-4 h-4" />
                {path.split('/').pop()}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
