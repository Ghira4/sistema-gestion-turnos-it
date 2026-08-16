'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import SelectorMes from '@/components/finanzas/SelectorMes'
import { ArrowLeft, Edit2, Check, X, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface VendedorPago {
  id: string
  nombre: string
  comision_porcentaje: number
  turnosAbonados: number
  montoBase: number
  comisionTotal: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function InformePagosPage() {
  const hoy = new Date()
  const [año, setAño] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [vendedores, setVendedores] = useState<VendedorPago[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [nuevoPorc, setNuevoPorc] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const desde = new Date(año, mes, 1).toISOString().split('T')[0]
    const hasta = new Date(año, mes + 1, 0).toISOString().split('T')[0]

    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name, comision_porcentaje')
      .contains('roles', ['vendedor'])
      .eq('is_active', true)

    if (!perfiles) { setLoading(false); return }

    const { data: turnos } = await supabase
      .from('turnos')
      .select('vendedor_id, precio_final, estado')
      .eq('estado', 'abonado')
      .gte('fecha_solicitud', desde)
      .lte('fecha_solicitud', hasta)
      .not('vendedor_id', 'is', null)

    const resultado: VendedorPago[] = perfiles.map(p => {
      const misTurnos = turnos?.filter(t => t.vendedor_id === p.id) ?? []
      const base = misTurnos.reduce((s, t) => s + t.precio_final, 0)
      return {
        id: p.id,
        nombre: p.full_name,
        comision_porcentaje: p.comision_porcentaje ?? 0,
        turnosAbonados: misTurnos.length,
        montoBase: base,
        comisionTotal: base * ((p.comision_porcentaje ?? 0) / 100),
      }
    }).sort((a, b) => b.comisionTotal - a.comisionTotal)

    setVendedores(resultado)
    setLoading(false)
  }, [año, mes])

  useEffect(() => { cargar() }, [cargar])

  async function handleGuardarComision(vendedorId: string) {
    const porc = parseFloat(nuevoPorc)
    if (isNaN(porc) || porc < 0 || porc > 100) { toast.error('Ingresá un porcentaje entre 0 y 100'); return }

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ comision_porcentaje: porc })
      .eq('id', vendedorId)

    if (error) { toast.error('Error al actualizar'); return }

    toast.success('Comisión actualizada')
    setEditando(null)
    cargar()
  }

  const totalLiquidar = vendedores.reduce((s, v) => s + v.comisionTotal, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/informes" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Liquidación de comisiones</h1>
            <p className="text-sm text-muted-foreground">Comisiones a pagar por turnos abonados</p>
          </div>
        </div>
        <SelectorMes año={año} mes={mes} onChange={(a, m) => { setAño(a); setMes(m) }} />
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-green-700">Total a liquidar este mes</CardTitle>
          <DollarSign className="w-4 h-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-700">{fmt(totalLiquidar)}</p>
          <p className="text-xs text-green-600 mt-1">
            Entre {vendedores.filter(v => v.comisionTotal > 0).length} vendedores con comisiones
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por vendedor</CardTitle>
          <p className="text-xs text-muted-foreground">Supervisores pueden editar el % de comisión directamente</p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
          ) : vendedores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay vendedores activos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendedor</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Turnos abonados</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto base</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">% Comisión</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">A liquidar</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vendedores.map(v => (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{v.nombre}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline">{v.turnosAbonados}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{fmt(v.montoBase)}</td>
                      <td className="px-4 py-3 text-right">
                        {editando === v.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              value={nuevoPorc}
                              onChange={e => setNuevoPorc(e.target.value)}
                              className="w-20 h-7 text-xs text-right"
                              min={0} max={100} step={0.5}
                              autoFocus
                            />
                            <button onClick={() => handleGuardarComision(v.id)} className="text-green-600 hover:text-green-700">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditando(null)} className="text-muted-foreground hover:text-red-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="flex items-center justify-end gap-1 ml-auto group"
                            onClick={() => { setEditando(v.id); setNuevoPorc(String(v.comision_porcentaje)) }}
                          >
                            <span className="font-medium">{v.comision_porcentaje}%</span>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{fmt(v.comisionTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50">
                    <td className="px-4 py-3 font-semibold" colSpan={4}>Total</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700 text-base">{fmt(totalLiquidar)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
