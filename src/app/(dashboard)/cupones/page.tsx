'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generarCodigo } from '@/lib/cupones'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Download, MessageCircle, Copy, Check } from 'lucide-react'
import type { Cupon, UserProfile } from '@/types'

type CuponConEmisor = Omit<Cupon, 'emisor'> & { emisor: Pick<UserProfile, 'full_name'> | null }

export default function CuponesPage() {
  const supabase = createClient()
  const [cupones, setCupones] = useState<CuponConEmisor[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [perfil, setPerfil] = useState<UserProfile | null>(null)

  // form
  const [receptorNombre, setReceptorNombre] = useState('')
  const [receptorContacto, setReceptorContacto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setPerfil(p)

      const query = supabase
        .from('cupones')
        .select('*, emisor:profiles(full_name)')
        .order('created_at', { ascending: false })

      // vendedor solo ve los suyos
      if (p?.active_role === 'vendedor') {
        query.eq('emisor_id', user.id)
      }

      const { data } = await query
      setCupones((data ?? []) as CuponConEmisor[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    if (!perfil) return
    setGuardando(true)

    const codigo = generarCodigo(perfil.full_name, receptorNombre)

    const { data, error } = await supabase
      .from('cupones')
      .insert({
        codigo,
        emisor_id: perfil.id,
        receptor_nombre: receptorNombre,
        receptor_contacto: receptorContacto,
        canjeado: false,
      })
      .select('*, emisor:profiles(full_name)')
      .single()

    if (error) {
      toast.error('Error al crear cupón')
    } else {
      setCupones(prev => [data as CuponConEmisor, ...prev])
      toast.success(`Cupón ${codigo} creado`)
      setReceptorNombre('')
      setReceptorContacto('')
      setOpen(false)
    }
    setGuardando(false)
  }

  async function copiarCodigo(codigo: string) {
    await navigator.clipboard.writeText(codigo)
    setCopiado(codigo)
    setTimeout(() => setCopiado(null), 2000)
  }

  async function descargarImagen(cuponId: string, codigo: string, receptorNombre: string) {
    toast.info('Generando imagen...')
    const res = await fetch('/api/cupones/imagen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuponId, codigo, receptorNombre }),
    })
    if (!res.ok) { toast.error('Error generando imagen'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cupon-${codigo}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const puedeCrear = perfil && ['admin', 'jefe', 'supervisor', 'vendedor'].includes(perfil.active_role)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cupones</h1>
          <p className="text-muted-foreground text-sm">Genera cupones de 40% de descuento</p>
        </div>
        {puedeCrear && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center gap-2 bg-[#0f1b35] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#1a2d55] transition-colors">
              <Plus className="w-4 h-4" />
              Nuevo cupón
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear cupón</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrear} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label>Nombre del receptor</Label>
                  <Input
                    value={receptorNombre}
                    onChange={e => setReceptorNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Contacto (WhatsApp)</Label>
                  <Input
                    value={receptorContacto}
                    onChange={e => setReceptorContacto(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[#0f1b35] hover:bg-[#1a2d55]" disabled={guardando}>
                  {guardando ? 'Creando...' : 'Crear cupón'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : cupones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay cupones todavía
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {cupones.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-base tracking-wider">{c.codigo}</span>
                    <Badge variant={c.canjeado ? 'secondary' : 'default'} className={c.canjeado ? '' : 'bg-green-600'}>
                      {c.canjeado ? 'Canjeado' : 'Disponible'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Para: <span className="font-medium text-foreground">{c.receptor_nombre}</span>
                    {c.emisor && <span> · Emitido por {c.emisor.full_name}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copiarCodigo(c.codigo)}
                    title="Copiar código"
                  >
                    {copiado === c.codigo ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <a
                    href={`https://wa.me/${c.receptor_contacto.replace(/\D/g, '')}?text=Hola ${encodeURIComponent(c.receptor_nombre)}, tu cupón de descuento es: ${c.codigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon" title="Enviar por WhatsApp">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => descargarImagen(c.id, c.codigo, c.receptor_nombre)}
                    title="Descargar imagen"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
