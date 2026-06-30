'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ResumenCard from '@/components/finanzas/ResumenCard'
import SelectorMes from '@/components/finanzas/SelectorMes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TurnoIngreso {
  id: string
  cliente_nombre: string
  precio_final: number
  estado: string
  fecha_solicitud: string
  fecha_turno: string | null
  tipo: string
  vendedor?: { full_name: string }
}

function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function GananciasPage() {
  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [turnos, setTurnos] = useState<TurnoIngreso[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const desde = new Date(año, mes, 1).toISOString().split('T')[0]
    const hasta = new Date(año, mes + 1, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('turnos')
      .select('id, cliente_nombre, precio_final, estado, fecha_solicitud, fecha_turno, tipo, vendedor:profiles!turnos_vendedor_id_fkey(full_name)')
      .gte('fecha_solicitud', desde)
      .lte('fecha_solicitud', hasta)
      .order('fecha_solicitud', { ascending: false })

    setTurnos((data as unknown as TurnoIngreso[]) ?? [])
    setLoading(false)
  }, [año, mes])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  function handleMes(a: number, m: number) { setAño(a); setMes(m) }

  const cobrado = turnos.filter(t => t.estado === 'abonado').reduce((s, t) => s + t.precio_final, 0)
  const porCobrar = turnos.filter(t => t.estado !== 'abonado' && t.estado !== 'rechazado').reduce((s, t) => s + t.precio_final, 0)
  const total = cobrado + porCobrar

  // Datos para el gráfico: agrupar por día del mes
  const porDia = turnos
    .filter(t => t.estado === 'abonado')
    .reduce<Record<string, number>>((acc, t) => {
      const dia = t.fecha_solicitud.split('T')[0].split('-')[2]
      acc[dia] = (acc[dia] ?? 0) + t.precio_final
      return acc
    }, {})

  const datosGrafico = Object.entries(porDia)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([dia, monto]) => ({ dia: `${dia}`, monto }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ganancias</h1>
          <p className="text-sm text-muted-foreground">Ingresos por turnos abonados</p>
        </div>
        <SelectorMes año={año} mes={mes} onChange={handleMes} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResumenCard titulo="Total potencial" monto={total} icon={TrendingUp} color="blue" subtitulo={`${turnos.length} turnos`} />
        <ResumenCard titulo="Cobrado" monto={cobrado} icon={CheckCircle} color="green" subtitulo={`${turnos.filter(t => t.estado === 'abonado').length} abonados`} />
        <ResumenCard titulo="Por cobrar" monto={porCobrar} icon={Clock} color="yellow" subtitulo={`${turnos.filter(t => t.estado !== 'abonado' && t.estado !== 'rechazado').length} pendientes`} />
        <ResumenCard titulo="Ticket promedio" monto={turnos.length ? Math.round(total / turnos.length) : 0} icon={DollarSign} color="blue" />
      </div>

      {datosGrafico.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cobrado por día</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatMonto(Number(v))} labelFormatter={l => `Día ${l}`} />
                <Bar dataKey="monto" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Detalle de turnos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
          ) : turnos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay turnos este mes</p>
          ) : (
            <div className="divide-y">
              {turnos.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.cliente_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.tipo} · {t.fecha_solicitud}
                      {t.vendedor && ` · ${t.vendedor.full_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-sm">{formatMonto(t.precio_final)}</span>
                    <Badge
                      variant="outline"
                      className={t.estado === 'abonado'
                        ? 'border-green-500 text-green-700'
                        : t.estado === 'rechazado'
                        ? 'border-red-300 text-red-600'
                        : 'border-yellow-400 text-yellow-700'
                      }
                    >
                      {t.estado === 'abonado' ? 'Cobrado' : t.estado === 'rechazado' ? 'Rechazado' : 'Por cobrar'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
