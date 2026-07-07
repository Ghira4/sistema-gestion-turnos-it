'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Consulado } from '@/types'

export default function ConsuladosPage() {
  const [consulados, setConsulados] = useState<Consulado[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [pais, setPais] = useState('Italia')

  async function loadConsulados() {
    const supabase = createClient()
    const { data } = await supabase.from('consulados').select('*').order('nombre')
    if (data) setConsulados(data)
    setLoading(false)
  }

  useEffect(() => { loadConsulados() }, [])

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !ciudad) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('consulados').insert({ nombre, ciudad, pais })
    if (error) { toast.error('Error al crear'); setSaving(false); return }
    toast.success('Consulado creado')
    setNombre(''); setCiudad(''); setPais('Italia')
    setOpen(false)
    setSaving(false)
    loadConsulados()
  }

  async function toggleActivo(consulado: Consulado) {
    const supabase = createClient()
    await supabase.from('consulados').update({ activo: !consulado.activo }).eq('id', consulado.id)
    setConsulados(prev => prev.map(c => c.id === consulado.id ? { ...c, activo: !c.activo } : c))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consulados</h1>
          <p className="text-sm text-muted-foreground">{consulados.length} consulados registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <Plus className="w-4 h-4 mr-2" />Agregar consulado
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo consulado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrear} className="space-y-4">
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Consulado General de Italia" required />
              </div>
              <div className="space-y-1">
                <Label>Ciudad *</Label>
                <Input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Roma" required />
              </div>
              <div className="space-y-1">
                <Label>País</Label>
                <Input value={pais} onChange={e => setPais(e.target.value)} placeholder="Italia" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {consulados.map(c => (
            <Card key={c.id} className={!c.activo ? 'opacity-50' : ''}>
              <CardContent className="py-4 px-5 flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.ciudad}, {c.pais}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActivo(c)}
                  className="shrink-0"
                >
                  <Badge variant={c.activo ? 'default' : 'secondary'} className="text-xs cursor-pointer">
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
