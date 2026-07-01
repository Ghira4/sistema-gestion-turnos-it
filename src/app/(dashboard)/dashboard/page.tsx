'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Ticket, CalendarCheck, DollarSign, Clock, TrendingUp } from 'lucide-react'

interface DashboardData {
  usuariosActivos: number
  cuponesGenerados: number
  turnosPendientes: number
  ingresosMes: number
  porCobrar: number
  turnosHoy: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const hoy = new Date()
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
      const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]
      const todayStr = hoy.toISOString().split('T')[0]

      const [
        { count: usuariosActivos },
        { count: cuponesGenerados },
        { count: turnosPendientes },
        { count: turnosHoy },
        { data: turnosMes },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('cupones').select('*', { count: 'exact', head: true })
          .gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('turnos').select('*', { count: 'exact', head: true }).eq('fecha_turno', todayStr),
        supabase.from('turnos').select('precio_final, estado')
          .gte('fecha_solicitud', desde).lte('fecha_solicitud', hasta),
      ])

      const ingresosMes = turnosMes?.filter(t => t.estado === 'abonado').reduce((s: number, t: { precio_final: number }) => s + t.precio_final, 0) ?? 0
      const porCobrar = turnosMes?.filter(t => !['abonado','rechazado'].includes(t.estado)).reduce((s: number, t: { precio_final: number }) => s + t.precio_final, 0) ?? 0

      setData({
        usuariosActivos: usuariosActivos ?? 0,
        cuponesGenerados: cuponesGenerados ?? 0,
        turnosPendientes: turnosPendientes ?? 0,
        ingresosMes,
        porCobrar,
        turnosHoy: turnosHoy ?? 0,
      })
      setLoading(false)
    }

    cargar()

    // Actualización en tiempo real cada 30 segundos
    const interval = setInterval(cargar, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = data ? [
    { label: 'Usuarios activos', value: data.usuariosActivos, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Cupones este mes', value: data.cuponesGenerados, icon: Ticket, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Turnos pendientes', value: data.turnosPendientes, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Turnos hoy', value: data.turnosHoy, icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Cobrado este mes', value: fmt(data.ingresosMes), icon: DollarSign, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Por cobrar', value: fmt(data.porCobrar), icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen en tiempo real · se actualiza cada 30 segundos</p>
        </div>
        {!loading && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            En vivo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-3/4" /></CardHeader>
              <CardContent><div className="h-8 bg-muted rounded w-1/2" /></CardContent>
            </Card>
          ))
        ) : (
          stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
