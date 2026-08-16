'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import SelectorMes from '@/components/finanzas/SelectorMes'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { ArrowLeft, TrendingUp, Ticket, CheckCircle, Percent } from 'lucide-react'
import Link from 'next/link'

interface VendedorStats {
  id: string
  nombre: string
  cuponesGenerados: number
  cuponesCanjeados: number
  turnosVendidos: number
  montoGenerado: number
  comision: number
  porcentajeConversion: number
}

const COLORES = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function InformeVendedoresPage() {
  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [stats, setStats] = useState<VendedorStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      const supabase = createClient()

      const desde = new Date(año, mes, 1).toISOString().split('T')[0]
      const hasta = new Date(año, mes + 1, 0).toISOString().split('T')[0]

      // Traer vendedores activos con rol vendedor
      const { data: vendedores } = await supabase
        .from('profiles')
        .select('id, full_name, comision_porcentaje')
        .contains('roles', ['vendedor'])
        .eq('is_active', true)

      if (!vendedores) { setLoading(false); return }

      // Cupones generados por mes
      const { data: cupones } = await supabase
        .from('cupones')
        .select('emisor_id, canjeado')
        .gte('created_at', desde)
        .lte('created_at', hasta + 'T23:59:59')

      // Turnos del mes con vendedor
      const { data: turnos } = await supabase
        .from('turnos')
        .select('vendedor_id, precio_final, estado')
        .gte('fecha_solicitud', desde)
        .lte('fecha_solicitud', hasta)
        .not('vendedor_id', 'is', null)

      const resultado: VendedorStats[] = vendedores.map(v => {
        const misCupones = cupones?.filter(c => c.emisor_id === v.id) ?? []
        const canjeados = misCupones.filter(c => c.canjeado).length
        const misTurnos = turnos?.filter(t => t.vendedor_id === v.id) ?? []
        const abonados = misTurnos.filter(t => t.estado === 'abonado')
        const montoTotal = misTurnos.reduce((s, t) => s + t.precio_final, 0)

        return {
          id: v.id,
          nombre: v.full_name,
          cuponesGenerados: misCupones.length,
          cuponesCanjeados: canjeados,
          turnosVendidos: misTurnos.length,
          montoGenerado: montoTotal,
          comision: abonados.reduce((s, t) => s + t.precio_final, 0) * (v.comision_porcentaje / 100),
          porcentajeConversion: misCupones.length > 0 ? Math.round((canjeados / misCupones.length) * 100) : 0,
        }
      }).sort((a, b) => b.montoGenerado - a.montoGenerado)

      setStats(resultado)
      setLoading(false)
    }
    cargar()
  }, [año, mes])

  const totalMonto = stats.reduce((s, v) => s + v.montoGenerado, 0)
  const totalCupones = stats.reduce((s, v) => s + v.cuponesGenerados, 0)
  const totalTurnos = stats.reduce((s, v) => s + v.turnosVendidos, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/informes" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Informe de vendedores</h1>
            <p className="text-sm text-muted-foreground">Rendimiento por asesor</p>
          </div>
        </div>
        <SelectorMes año={año} mes={mes} onChange={(a, m) => { setAño(a); setMes(m) }} />
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Dinero generado', value: fmt(totalMonto), icon: TrendingUp, color: 'text-green-600' },
          { label: 'Cupones emitidos', value: totalCupones, icon: Ticket, color: 'text-indigo-600' },
          { label: 'Turnos vendidos', value: totalTurnos, icon: CheckCircle, color: 'text-blue-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`w-4 h-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico dinero generado */}
      {stats.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Dinero generado por vendedor</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="montoGenerado" radius={[0, 4, 4, 0]}>
                  {stats.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabla detallada */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detalle por vendedor</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
          ) : stats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay vendedores activos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendedor</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cupones</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Canjeados</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Conversión</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Turnos</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Generado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.map((v, i) => (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: COLORES[i % COLORES.length] }}>
                          {i + 1}
                        </span>
                        {v.nombre}
                      </td>
                      <td className="px-4 py-3 text-right">{v.cuponesGenerados}</td>
                      <td className="px-4 py-3 text-right">{v.cuponesCanjeados}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className={
                          v.porcentajeConversion >= 50 ? 'border-green-400 text-green-700'
                          : v.porcentajeConversion >= 25 ? 'border-yellow-400 text-yellow-700'
                          : 'border-red-300 text-red-600'
                        }>
                          <Percent className="w-3 h-3 mr-1" />{v.porcentajeConversion}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">{v.turnosVendidos}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(v.montoGenerado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
