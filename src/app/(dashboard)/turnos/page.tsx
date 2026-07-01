'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, MessageCircle } from 'lucide-react'
import type { Turno, UserProfile, TurnoTipo, TurnoOrigen } from '@/types'

const ESTADOS = ['pendiente', 'confirmado', 'rechazado', 'listo', 'abonado'] as const
const COLORES: Record<string, string> = {
  pendiente: 'bg-yellow-500',
  confirmado: 'bg-blue-500',
  rechazado: 'bg-red-500',
  listo: 'bg-purple-500',
  abonado: 'bg-green-600',
}

export default function TurnosPage() {
  const supabase = createClient()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [perfil, setPerfil] = useState<UserProfile | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteContacto, setClienteContacto] = useState('')
  const [tipo, setTipo] = useState<TurnoTipo>('CIE')
  const [origen, setOrigen] = useState<TurnoOrigen>('asesor')
  const [precioOriginal, setPrecioOriginal] = useState('')
  const [precioFinal, setPrecioFinal] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    load()
  }, [filtroEstado])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setPerfil(p)

    let query = supabase
      .from('turnos')
      .select('*, consulado:consulados(nombre, ciudad)')
      .order('created_at', { ascending: false })

    if (filtroEstado !== 'todos') query = query.eq('estado', filtroEstado)
    if (p?.active_role === 'vendedor') query = query.eq('vendedor_id', user.id)
    if (p?.active_role === 'gestor') query = query.eq('gestor_id', user.id)

    const { data } = await query
    setTurnos((data ?? []) as Turno[])
    setLoading(false)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!perfil) return
    setGuardando(true)

    const { error } = await supabase.from('turnos').insert({
      tipo,
      origen,
      cliente_nombre: clienteNombre,
      cliente_contacto: clienteContacto,
      precio_original: Number(precioOriginal),
      precio_final: Number(precioFinal),
      estado: 'pendiente',
      vendedor_id: perfil.active_role === 'vendedor' ? perfil.id : null,
    })

    if (error) {
      toast.error('Error al crear turno')
    } else {
      toast.success('Turno creado')
      setOpen(false)
      setClienteNombre(''); setClienteContacto(''); setPrecioOriginal(''); setPrecioFinal('')
      load()
    }
    setGuardando(false)
  }

  async function cambiarEstado(id: string, estado: string) {
    await supabase.from('turnos').update({ estado }).eq('id', id)
    setTurnos(prev => prev.map(t => t.id === id ? { ...t, estado: estado as Turno['estado'] } : t))
    toast.success('Estado actualizado')
  }

  const puedeCrear = perfil && ['admin', 'jefe', 'supervisor', 'vendedor'].includes(perfil.active_role)
  const puedeEditar = perfil && ['admin', 'jefe', 'supervisor', 'gestor'].includes(perfil.active_role)

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Turnos</h1>
          <p className="text-muted-foreground text-sm">{turnos.length} turnos</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroEstado} onValueChange={v => v && setFiltroEstado(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {ESTADOS.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          {puedeCrear && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger className="inline-flex items-center gap-2 bg-[#0f1b35] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#1a2d55] transition-colors">
                <Plus className="w-4 h-4" />
                Nuevo turno
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo turno</DialogTitle></DialogHeader>
                <form onSubmit={handleCrear} className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={v => v && setTipo(v as TurnoTipo)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CIE">CIE</SelectItem>
                          <SelectItem value="CIUDADANIA">Ciudadanía</SelectItem>
                          <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Origen</Label>
                      <Select value={origen} onValueChange={v => v && setOrigen(v as TurnoOrigen)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asesor">Asesor</SelectItem>
                          <SelectItem value="redes_sociales">Redes sociales</SelectItem>
                          <SelectItem value="ciudadania_italiana">Ciudadanía italiana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Nombre del cliente</Label>
                    <Input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Contacto (WhatsApp)</Label>
                    <Input value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Precio original ($)</Label>
                      <Input type="number" value={precioOriginal} onChange={e => setPrecioOriginal(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Precio final ($)</Label>
                      <Input type="number" value={precioFinal} onChange={e => setPrecioFinal(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[#0f1b35] hover:bg-[#1a2d55]" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Crear turno'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : turnos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay turnos</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {turnos.map(t => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center gap-4">
                <div className={`w-2 self-stretch rounded-full ${COLORES[t.estado]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{t.cliente_nombre}</span>
                    <Badge variant="outline" className="text-xs">{t.tipo}</Badge>
                    <Badge variant="outline" className="text-xs">{t.origen.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    ${t.precio_final.toLocaleString('es-AR')}
                    {t.precio_final !== t.precio_original && (
                      <span className="line-through ml-2 text-xs">${t.precio_original.toLocaleString('es-AR')}</span>
                    )}
                    <span className="mx-2">·</span>
                    {new Date(t.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://wa.me/${t.cliente_contacto.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon"><MessageCircle className="w-4 h-4 text-green-600" /></Button>
                  </a>
                  {puedeEditar && (
                    <Select value={t.estado} onValueChange={v => v && cambiarEstado(t.id, v)}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
