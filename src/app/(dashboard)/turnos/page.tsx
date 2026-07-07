'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import EstadoBadge from '@/components/turnos/EstadoBadge'
import OrigenBadge from '@/components/turnos/OrigenBadge'
import { Plus, Search, FileText } from 'lucide-react'
import Link from 'next/link'
import type { Turno } from '@/types'

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroOrigen, setFiltroOrigen] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  useEffect(() => {
    async function loadTurnos() {
      const supabase = createClient()
      const { data } = await supabase
        .from('turnos')
        .select('*, consulado:consulados(nombre, ciudad)')
        .order('created_at', { ascending: false })
      if (data) setTurnos(data as Turno[])
      setLoading(false)
    }
    loadTurnos()
  }, [])

  const filtrados = turnos.filter(t => {
    const matchBusqueda = busqueda === '' ||
      t.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.cliente_contacto.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || t.estado === filtroEstado
    const matchOrigen = filtroOrigen === 'todos' || t.origen === filtroOrigen
    const matchTipo = filtroTipo === 'todos' || t.tipo === filtroTipo
    return matchBusqueda && matchEstado && matchOrigen && matchTipo
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Turnos</h1>
          <p className="text-sm text-muted-foreground">{filtrados.length} turno{filtrados.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/turnos/nuevo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo turno
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            className="pl-9"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <Select value={filtroEstado} onValueChange={(v) => v && setFiltroEstado(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
            <SelectItem value="listo">Listo</SelectItem>
            <SelectItem value="abonado">Abonado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroOrigen} onValueChange={(v) => v && setFiltroOrigen(v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Origen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los orígenes</SelectItem>
            <SelectItem value="asesor">Asesor</SelectItem>
            <SelectItem value="redes_sociales">Redes Sociales</SelectItem>
            <SelectItem value="ciudadania_italiana">Ciudadanía Italiana</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTipo} onValueChange={(v) => v && setFiltroTipo(v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="CIE">CIE</SelectItem>
            <SelectItem value="CIUDADANIA">Ciudadanía</SelectItem>
            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 text-sm">
          No hay turnos que coincidan con los filtros
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(turno => (
            <Link key={turno.id} href={`/turnos/${turno.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium truncate">{turno.cliente_nombre}</p>
                      <p className="text-sm text-muted-foreground">{turno.cliente_contacto}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{turno.tipo}</span>
                      <OrigenBadge origen={turno.origen} />
                      <EstadoBadge estado={turno.estado} />
                      {(turno.archivos?.length ?? 0) > 0 && (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">
                        {turno.precio_final.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </p>
                      {turno.fecha_turno && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(turno.fecha_turno + 'T00:00:00').toLocaleDateString('es-AR')}
                        </p>
                      )}
                    </div>
                  </div>
                  {turno.consulado && (
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {turno.consulado.nombre} — {turno.consulado.ciudad}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
