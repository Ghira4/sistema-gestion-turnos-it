'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Download, Send, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Cupon, Role } from '@/types'

interface CuponConEmisor extends Omit<Cupon, 'emisor'> {
  emisor?: { full_name: string }
  vendedor_nombre?: string
}

export default function CuponesPage() {
  const [cupones, setCupones] = useState<CuponConEmisor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRole, setActiveRole] = useState<Role>('vendedor')
  const [userId, setUserId] = useState('')

  // Agrupados por emisor (para vista supervisor/jefe)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: perfil } = await supabase
        .from('profiles')
        .select('active_role, roles')
        .eq('id', user.id)
        .single()

      const role = perfil?.active_role ?? 'vendedor'
      setActiveRole(role)

      let query = supabase
        .from('cupones')
        .select('*, emisor:profiles!cupones_emisor_id_fkey(full_name)')
        .order('created_at', { ascending: false })

      // Vendedor solo ve los suyos
      if (role === 'vendedor') {
        query = query.eq('emisor_id', user.id)
      }

      const { data } = await query
      if (data) setCupones(data as CuponConEmisor[])
      setLoading(false)
    }
    load()
  }, [])

  function toggleEmisor(emisorId: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(emisorId) ? next.delete(emisorId) : next.add(emisorId)
      return next
    })
  }

  function handleDescargar(codigo: string) {
    window.open(`/api/cupones/imagen?codigo=${codigo}`, '_blank')
  }

  function handleWhatsApp(cupon: CuponConEmisor) {
    if (!cupon.receptor_contacto) { toast.error('El cupón no tiene contacto registrado'); return }
    const numero = cupon.receptor_contacto.replace(/\D/g, '')
    const mensaje = encodeURIComponent(
      `¡Hola ${cupon.receptor_nombre}! 🎉 Tu cupón de descuento del 40% de Turnos IT.\n\nCódigo: *${cupon.codigo}*\n\nEnvialo por WhatsApp para aplicar el descuento.`
    )
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank')
  }

  // Agrupar por emisor para supervisores/admins
  const esSupervisor = ['admin', 'jefe', 'supervisor'].includes(activeRole)
  const porEmisor = esSupervisor
    ? cupones.reduce<Record<string, { nombre: string; cupones: CuponConEmisor[] }>>((acc, c) => {
        const eid = c.emisor_id
        if (!acc[eid]) acc[eid] = { nombre: c.emisor?.full_name ?? 'Desconocido', cupones: [] }
        acc[eid].cupones.push(c)
        return acc
      }, {})
    : null

  const CuponRow = ({ c }: { c: CuponConEmisor }) => (
    <div className="flex items-center justify-between gap-3 py-3 px-4 border-b last:border-0 flex-wrap">
      <div className="space-y-0.5 min-w-0">
        <p className="font-mono font-bold text-sm">{c.codigo}</p>
        <p className="text-xs text-muted-foreground truncate">Para: {c.receptor_nombre}</p>
        {c.receptor_contacto && (
          <p className="text-xs text-muted-foreground">{c.receptor_contacto}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={c.canjeado ? 'secondary' : 'outline'} className={c.canjeado ? '' : 'border-green-500 text-green-700'}>
          {c.canjeado ? 'Canjeado' : 'Disponible'}
        </Badge>
        <button onClick={() => handleDescargar(c.codigo)} title="Descargar imagen">
          <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
        <button onClick={() => handleWhatsApp(c)} title="Enviar por WhatsApp">
          <Send className="w-4 h-4 text-muted-foreground hover:text-green-600" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupones</h1>
          <p className="text-sm text-muted-foreground">{cupones.length} cupón{cupones.length !== 1 ? 'es' : ''} generado{cupones.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/cupones/nuevo">
          <Button><Plus className="w-4 h-4 mr-2" />Generar cupón</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Cargando...</div>
      ) : cupones.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 text-sm">
          No hay cupones generados aún
        </div>
      ) : esSupervisor && porEmisor ? (
        // Vista agrupada por emisor
        <div className="space-y-3">
          {Object.entries(porEmisor).map(([emisorId, grupo]) => (
            <Card key={emisorId}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                onClick={() => toggleEmisor(emisorId)}
              >
                <div className="flex items-center gap-3">
                  {expandidos.has(emisorId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium text-sm">{grupo.nombre}</span>
                  {emisorId === userId && <Badge variant="secondary" className="text-xs">Vos</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{grupo.cupones.length} cupones</span>
                  <span>·</span>
                  <span className="text-green-600">{grupo.cupones.filter(c => !c.canjeado).length} activos</span>
                  <span>·</span>
                  <span>{grupo.cupones.filter(c => c.canjeado).length} canjeados</span>
                </div>
              </button>
              {expandidos.has(emisorId) && (
                <CardContent className="p-0 border-t">
                  {grupo.cupones.map(c => <CuponRow key={c.id} c={c} />)}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        // Vista simple (vendedor)
        <Card>
          <CardContent className="p-0">
            {cupones.map(c => <CuponRow key={c.id} c={c} />)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
