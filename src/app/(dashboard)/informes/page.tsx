'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { UserProfile, Turno } from '@/types'

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

interface VendedorStat {
  vendedor: string
  vendedor_id: string
  total: number
  abonados: number
  conversion: number
  monto: number
}

export default function InformesPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<VendedorStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: turnos }, { data: perfiles }] = await Promise.all([
        supabase.from('turnos').select('vendedor_id, estado, precio_final').not('vendedor_id', 'is', null),
        supabase.from('profiles').select('id, full_name'),
      ])

      if (!turnos || !perfiles) return

      const porVendedor: Record<string, VendedorStat> = {}
      for (const t of turnos as Turno[]) {
        if (!t.vendedor_id) continue
        if (!porVendedor[t.vendedor_id]) {
          const p = (perfiles as UserProfile[]).find(p => p.id === t.vendedor_id)
          porVendedor[t.vendedor_id] = {
            vendedor: p?.full_name ?? 'Desconocido',
            vendedor_id: t.vendedor_id,
            total: 0, abonados: 0, conversion: 0, monto: 0,
          }
        }
        porVendedor[t.vendedor_id].total++
        if (t.estado === 'abonado') {
          porVendedor[t.vendedor_id].abonados++
          porVendedor[t.vendedor_id].monto += t.precio_final
        }
      }

      const result = Object.values(porVendedor).map(v => ({
        ...v,
        conversion: v.total > 0 ? Math.round((v.abonados / v.total) * 100) : 0,
      })).sort((a, b) => b.monto - a.monto)

      setStats(result)
      setLoading(false)
    }
    load()
  }, [])

  const chartData = stats.map(s => ({ name: s.vendedor.split(' ')[0], monto: s.monto, conversion: s.conversion }))

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Informes</h1>
        <p className="text-muted-foreground text-sm">Rendimiento por vendedor</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Monto recaudado por vendedor</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 bg-muted animate-pulse rounded" />
          ) : chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Bar dataKey="monto" name="Monto" fill="#0f1b35" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ranking de vendedores</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : stats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin datos de vendedores</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Vendedor</th>
                  <th className="pb-2 font-medium text-right">Turnos</th>
                  <th className="pb-2 font-medium text-right">Abonados</th>
                  <th className="pb-2 font-medium text-right">Conversión</th>
                  <th className="pb-2 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.vendedor_id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 font-medium">{s.vendedor}</td>
                    <td className="py-2 text-right">{s.total}</td>
                    <td className="py-2 text-right">{s.abonados}</td>
                    <td className="py-2 text-right">
                      <span className={s.conversion >= 50 ? 'text-green-600' : 'text-yellow-600'}>{s.conversion}%</span>
                    </td>
                    <td className="py-2 text-right font-semibold">{fmt(s.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
