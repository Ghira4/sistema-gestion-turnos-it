'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Consulado } from '@/types'

const DESCUENTO = 0.40

export default function NuevoTurnoForm() {
  const router = useRouter()
  const [consulados, setConsulados] = useState<Consulado[]>([])
  const [loading, setLoading] = useState(false)

  // Campos del form
  const [consuladoId, setConsuladoId] = useState('')
  const [tipo, setTipo] = useState('')
  const [origen, setOrigen] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteContacto, setClienteContacto] = useState('')
  const [datosAdicionales, setDatosAdicionales] = useState('')
  const [precioOriginal, setPrecioOriginal] = useState('')
  const [fechaTurno, setFechaTurno] = useState('')
  const [archivos, setArchivos] = useState<File[]>([])

  // Cupón
  const [codigoCupon, setCodigoCupon] = useState('')
  const [cuponEstado, setCuponEstado] = useState<'idle' | 'valido' | 'invalido' | 'fisico'>('idle')
  const [cuponId, setCuponId] = useState<string | null>(null)
  const [esCuponFisico, setEsCuponFisico] = useState(false)

  const precioFinal = () => {
    const p = parseFloat(precioOriginal) || 0
    if (cuponEstado === 'valido' || cuponEstado === 'fisico') return p * (1 - DESCUENTO)
    return p
  }

  useEffect(() => {
    async function loadConsulados() {
      const supabase = createClient()
      const { data } = await supabase.from('consulados').select('*').eq('activo', true).order('nombre')
      if (data) setConsulados(data)
    }
    loadConsulados()
  }, [])

  async function verificarCupon() {
    if (!codigoCupon.trim()) return
    const supabase = createClient()
    const { data } = await supabase
      .from('cupones')
      .select('id, canjeado')
      .eq('codigo', codigoCupon.trim().toUpperCase())
      .single()

    if (!data) { setCuponEstado('invalido'); setCuponId(null); return }
    if (data.canjeado) { setCuponEstado('invalido'); setCuponId(null); return }
    setCuponEstado('valido')
    setCuponId(data.id)
  }

  function activarCuponFisico() {
    setEsCuponFisico(true)
    setCuponEstado('fisico')
    setCuponId(null)
  }

  function quitarCupon() {
    setCodigoCupon('')
    setCuponEstado('idle')
    setCuponId(null)
    setEsCuponFisico(false)
  }

  function handleArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setArchivos(prev => [...prev, ...Array.from(e.target.files!)])
  }

  function quitarArchivo(i: number) {
    setArchivos(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consuladoId || !tipo || !origen || !clienteNombre) {
      toast.error('Completá los campos obligatorios')
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Subir archivos a Supabase Storage
    const urlsArchivos: string[] = []
    for (const file of archivos) {
      const ext = file.name.split('.').pop()
      const path = `turnos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('archivos-turnos').upload(path, file)
      if (!error) urlsArchivos.push(path)
    }

    const { data: turno, error } = await supabase.from('turnos').insert({
      consulado_id: consuladoId,
      tipo,
      origen,
      cliente_nombre: clienteNombre,
      cliente_contacto: clienteContacto,
      datos_adicionales: datosAdicionales ? { notas: datosAdicionales } : {},
      cupon_id: cuponId,
      precio_original: parseFloat(precioOriginal) || 0,
      precio_final: precioFinal(),
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString().split('T')[0],
      fecha_turno: fechaTurno || null,
      gestor_id: user?.id,
      archivos: urlsArchivos,
    }).select().single()

    if (error) {
      toast.error('Error al crear el turno')
      setLoading(false)
      return
    }

    // Marcar cupón como canjeado
    if (cuponId) {
      await supabase.from('cupones').update({ canjeado: true, turno_id: turno.id }).eq('id', cuponId)
    }

    toast.success('Turno creado correctamente')
    router.push('/turnos')
  }

  const tieneDescuento = cuponEstado === 'valido' || cuponEstado === 'fisico'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Datos del turno */}
      <Card>
        <CardHeader><CardTitle className="text-base">Datos del turno</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <Label>Consulado *</Label>
            <Select value={consuladoId} onValueChange={(v) => v && setConsuladoId(v)}>
              <SelectTrigger><SelectValue placeholder="Seleccioná un consulado" /></SelectTrigger>
              <SelectContent>
                {consulados.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre} — {c.ciudad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Tipo de turno *</Label>
            <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CIE">CIE</SelectItem>
                <SelectItem value="CIUDADANIA">Ciudadanía</SelectItem>
                <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Origen *</Label>
            <Select value={origen} onValueChange={(v) => v && setOrigen(v)}>
              <SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asesor">Asesor</SelectItem>
                <SelectItem value="redes_sociales">Redes Sociales</SelectItem>
                <SelectItem value="ciudadania_italiana">Ciudadanía Italiana</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Fecha del turno</Label>
            <Input type="date" value={fechaTurno} onChange={e => setFechaTurno(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Datos del cliente */}
      <Card>
        <CardHeader><CardTitle className="text-base">Datos del cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre completo *</Label>
              <Input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div className="space-y-1">
              <Label>Contacto (WhatsApp / email)</Label>
              <Input value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} placeholder="+54911..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Datos adicionales / notas</Label>
            <Textarea
              value={datosAdicionales}
              onChange={e => setDatosAdicionales(e.target.value)}
              placeholder="Datos necesarios para el turno..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Cupón y precio */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cupón y precio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!esCuponFisico ? (
            <div className="space-y-2">
              <Label>Código de cupón</Label>
              <div className="flex gap-2">
                <Input
                  value={codigoCupon}
                  onChange={e => { setCodigoCupon(e.target.value.toUpperCase()); setCuponEstado('idle') }}
                  placeholder="Ej: TIT-ABC123"
                  disabled={cuponEstado === 'valido'}
                  className="font-mono"
                />
                {cuponEstado === 'idle' && (
                  <Button type="button" variant="outline" onClick={verificarCupon}>Verificar</Button>
                )}
                {(cuponEstado === 'valido' || cuponEstado === 'invalido') && (
                  <Button type="button" variant="outline" onClick={quitarCupon}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {cuponEstado === 'valido' && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Cupón válido — 40% de descuento aplicado
                </p>
              )}
              {cuponEstado === 'invalido' && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Cupón inválido o ya utilizado
                </p>
              )}
              <button
                type="button"
                onClick={activarCuponFisico}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                ¿Cupón físico entregado fuera del sistema?
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Cupón físico — 40% descuento
              </Badge>
              <button type="button" onClick={quitarCupon} className="text-xs text-muted-foreground underline">
                Quitar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Precio original</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={precioOriginal}
                onChange={e => setPrecioOriginal(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio final</Label>
              <div className={`h-10 px-3 flex items-center rounded-md border text-sm font-semibold ${tieneDescuento ? 'text-green-700 bg-green-50 border-green-200' : 'bg-muted'}`}>
                {precioFinal().toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                {tieneDescuento && <span className="ml-2 text-xs font-normal">(-40%)</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archivos */}
      <Card>
        <CardHeader><CardTitle className="text-base">Archivos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Subir fotos o PDFs</span>
            <input type="file" multiple accept="image/*,.pdf" onChange={handleArchivos} className="hidden" />
          </label>
          {archivos.length > 0 && (
            <ul className="space-y-1">
              {archivos.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm bg-muted px-3 py-1.5 rounded">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => quitarArchivo(i)}>
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear turno'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/turnos')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
