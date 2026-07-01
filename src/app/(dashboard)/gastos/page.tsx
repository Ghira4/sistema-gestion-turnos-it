'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import type { Gasto } from '@/types'

const CATEGORIAS = ['Sueldos', 'Servicios', 'Marketing', 'Infraestructura', 'Impuestos', 'Otros']
const COLORES = ['#0f1b35','#1d4ed8','#7c3aed','#db2777','#ea580c','#ca8a04']
const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`

export default function GastosPage() {
  const supabase = createClient()
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false })
      setGastos((data ?? []) as Gasto[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('gastos')
      .insert({ descripcion, monto: Number(monto), categoria, fecha, registrado_por: user!.id })
      .select()
      .single()
    if (error) {
      toast.error('Error al registrar gasto')
    } else {
      setGastos(prev => [data as Gasto, ...prev])
      toast.success('Gasto registrado')
      setDescripcion(''); setMonto(''); setOpen(false)
    }
    setGuardando(false)
  }

  async function handleEliminar(id: string) {
    await supabase.from('gastos').delete().eq('id', id)
    setGastos(prev => prev.filter(g => g.id !== id))
    toast.success('Gasto eliminado')
  }

  const total = gastos.reduce((s, g) => s + g.monto, 0)

  const porCategoria = CATEGORIAS.map((cat, i) => ({
    name: cat,
    value: gastos.filter(g => g.categoria === cat).reduce((s, g) => s + g.monto, 0),
    color: COLORES[i],
  })).filter(c => c.value > 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-muted-foreground text-sm">Total: {fmt(total)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 bg-[#0f1b35] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#1a2d55] transition-colors">
            <Plus className="w-4 h-4" />
            Registrar gasto
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo gasto</DialogTitle></DialogHeader>
            <form onSubmit={handleCrear} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Descripción</Label>
                <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Monto ($)</Label>
                  <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Fecha</Label>
                  <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select value={categoria} onValueChange={v => v && setCategoria(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-[#0f1b35] hover:bg-[#1a2d55]" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Registrar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Por categoría</CardTitle></CardHeader>
          <CardContent>
            {porCategoria.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={porCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {porCategoria.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Últimos gastos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)
            ) : gastos.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sin gastos registrados</p>
            ) : (
              gastos.slice(0, 8).map(g => (
                <div
                  key={g.id}
                  className="flex items-center justify-between py-1 group"
                  onMouseEnter={() => setHoverId(g.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <div>
                    <p className="text-sm font-medium">{g.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{g.categoria} · {new Date(g.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-600">{fmt(g.monto)}</span>
                    {hoverId === g.id && (
                      <button onClick={() => handleEliminar(g.id)} className="text-muted-foreground hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
