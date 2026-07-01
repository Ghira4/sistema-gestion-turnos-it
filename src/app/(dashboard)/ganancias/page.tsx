'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Turno } from '@/types'

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function GananciasPage() {
  const supabase = createClient()
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear())

  const anios = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('turnos')
        .select('precio_final, precio_original, estado, created_at')
        .gte('created_at', `${anio}-01-01`)
        .lt('created_at', `${anio + 1}-01-01`)
      setTurnos((data ?? []) as Turno[])
      setLoading(false)
    }
    load()
  }, [anio])

  const porMes = MESES.map((mes, i) => {
    const del_mes = turnos.filter(t => new Date(t.created_at).getMonth() === i)
    const cobrado = del_mes.filter(t => t.estado === 'abonado').reduce((s, t) => s + t.precio_final, 0)
    const por_cobrar = del_mes.filter(t => t.estado !== 'abonado' && t.estado !== 'rechazado').reduce((s, t) => s + t.precio_final, 0)
    return { mes: mes.slice(0, 3), cobrado, por_cobrar }
  })

  const totalCobrado = porMes.reduce((s, m) => s + m.cobrado, 0)
  const totalPorCobrar = porMes.reduce((s, m) => s + m.por_cobrar, 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ganancias</h1>
          <p className="text-muted-foreground text-sm">Ingresos por turnos</p>
        </div>
        <Select value={String(anio)} onValueChange={v => v && setAnio(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {anios.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total cobrado</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{fmt(totalCobrado)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Por cobrar</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-yellow-500">{fmt(totalPorCobrar)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Evolución mensual {anio}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 bg-muted animate-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porMes}>
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} />
                <Legend />
                <Bar dataKey="cobrado" name="Cobrado" fill="#16a34a" radius={[3,3,0,0]} />
                <Bar dataKey="por_cobrar" name="Por cobrar" fill="#eab308" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
