'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ResumenCard from '@/components/finanzas/ResumenCard'
import SelectorMes from '@/components/finanzas/SelectorMes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingDown, Plus, Trash2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from 'sonner'
import type { Gasto } from '@/types'

const CATEGORIAS = ['Sueldos', 'Marketing', 'Herramientas', 'Servicios', 'Impuestos', 'Comisiones', 'Otros']

const COLORES = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444']

function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function GastosPage() {
  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState('')

  // Form
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('Otros')
  const [fecha, setFecha] = useState(hoy.toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const cargarGastos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const desde = new Date(año, mes, 1).toISOString().split('T')[0]
    const hasta = new Date(año, mes + 1, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('gastos')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })

    setGastos((data as Gasto[]) ?? [])
    setLoading(false)
  }, [año, mes])

  useEffect(() => { cargarGastos() }, [cargarGastos])

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!descripcion || !monto) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('gastos').insert({
      descripcion,
      monto: parseFloat(monto),
      categoria,
      fecha,
      registrado_por: userId,
    })

    if (error) { toast.error('Error al guardar el gasto'); setSaving(false); return }

    toast.success('Gasto registrado')
    setOpen(false)
    setDescripcion(''); setMonto(''); setCategoria('Otros')
    setFecha(new Date().toISOString().split('T')[0])
    cargarGastos()
    setSaving(false)
  }

  async function handleEliminar(id: string) {
    const supabase = createClient()
    await supabase.from('gastos').delete().eq('id', id)
    setGastos(prev => prev.filter(g => g.id !== id))
    toast.success('Gasto eliminado')
  }

  const totalMes = gastos.reduce((s, g) => s + g.monto, 0)

  // Datos para el gráfico de torta por categoría
  const porCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] ?? 0) + g.monto
    return acc
  }, {})
  const datosGrafico = Object.entries(porCategoria).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-sm text-muted-foreground">Registro de egresos del mes</p>
        </div>
        <div className="flex items-center gap-3">
          <SelectorMes año={año} mes={mes} onChange={(a, m) => { setAño(a); setMes(m) }} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex">
              <Button><Plus className="w-4 h-4 mr-2" />Nuevo gasto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar gasto</DialogTitle></DialogHeader>
              <form onSubmit={handleGuardar} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Descripción *</Label>
                  <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Sueldo julio" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Monto (ARS) *</Label>
                    <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0" required min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label>Fecha</Label>
                    <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Categoría</Label>
                  <Select value={categoria} onValueChange={(v) => v && setCategoria(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar gasto'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResumenCard titulo="Total gastado" monto={totalMes} icon={TrendingDown} color="red" subtitulo={`${gastos.length} registros`} />
        <ResumenCard titulo="Mayor categoría"
          monto={datosGrafico.length ? Math.max(...datosGrafico.map(d => d.value)) : 0}
          icon={TrendingDown} color="red"
          subtitulo={datosGrafico.sort((a,b) => b.value - a.value)[0]?.name ?? '—'}
        />
        <ResumenCard titulo="Promedio por gasto"
          monto={gastos.length ? Math.round(totalMes / gastos.length) : 0}
          icon={TrendingDown} color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {datosGrafico.length > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-base">Por categoría</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={datosGrafico} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={false}>
                    {datosGrafico.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMonto(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className={datosGrafico.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardHeader><CardTitle className="text-base">Detalle</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
            ) : gastos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay gastos registrados este mes</p>
            ) : (
              <div className="divide-y">
                {gastos.map(g => (
                  <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap group">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{g.descripcion}</p>
                      <p className="text-xs text-muted-foreground">{g.categoria} · {g.fecha}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-sm text-red-600">{formatMonto(g.monto)}</span>
                      <button
                        onClick={() => handleEliminar(g.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
