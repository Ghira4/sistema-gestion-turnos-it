'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, UserX, UserCheck, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile, Role } from '@/types'

const ROLES: Role[] = ['admin', 'jefe', 'supervisor', 'vendedor', 'gestor']
const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador', jefe: 'Jefe', supervisor: 'Supervisor', vendedor: 'Vendedor', gestor: 'Gestor',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [openNuevo, setOpenNuevo] = useState(false)
  const [openEditar, setOpenEditar] = useState<UserProfile | null>(null)

  // Form nuevo usuario
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [rolesNuevo, setRolesNuevo] = useState<Role[]>(['vendedor'])
  const [saving, setSaving] = useState(false)

  // Form editar
  const [rolesEditar, setRolesEditar] = useState<Role[]>([])

  async function cargar() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (data) setUsuarios(data as UserProfile[])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function handleCrearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Crear usuario via API de Supabase Auth (admin)
    const res = await fetch('/api/usuarios/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: nombre, roles: rolesNuevo }),
    })

    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Error al crear usuario'); setSaving(false); return }

    toast.success(`Usuario ${nombre} creado`)
    setOpenNuevo(false)
    setEmail(''); setNombre(''); setPassword(''); setRolesNuevo(['vendedor'])
    cargar()
    setSaving(false)
  }

  async function handleToggleActivo(u: UserProfile) {
    const supabase = createClient()
    await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id)
    toast.success(u.is_active ? 'Usuario suspendido' : 'Usuario reactivado')
    cargar()
  }

  async function handleGuardarRoles(e: React.FormEvent) {
    e.preventDefault()
    if (!openEditar) return
    const supabase = createClient()
    await supabase.from('profiles').update({ roles: rolesEditar }).eq('id', openEditar.id)
    toast.success('Roles actualizados')
    setOpenEditar(null)
    cargar()
  }

  function toggleRol(rol: Role, lista: Role[], setLista: (r: Role[]) => void) {
    if (lista.includes(rol)) setLista(lista.filter(r => r !== rol))
    else setLista([...lista, rol])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{usuarios.length} usuarios registrados</p>
        </div>

        <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
          <DialogTrigger className="inline-flex">
            <Button><Plus className="w-4 h-4 mr-2" />Nuevo usuario</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear usuario</DialogTitle></DialogHeader>
            <form onSubmit={handleCrearUsuario} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Nombre completo *</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Pérez" required />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@turnosit.com" required />
              </div>
              <div className="space-y-1">
                <Label>Contraseña inicial *</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(r => (
                    <button type="button" key={r}
                      onClick={() => toggleRol(r, rolesNuevo, setRolesNuevo)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        rolesNuevo.includes(r)
                          ? 'bg-[#0f1b35] text-white border-[#0f1b35]'
                          : 'border-muted-foreground/30 text-muted-foreground hover:border-foreground'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
                {rolesNuevo.length === 0 && <p className="text-xs text-red-500">Seleccioná al menos un rol</p>}
              </div>
              <Button type="submit" className="w-full" disabled={saving || rolesNuevo.length === 0}>
                {saving ? 'Creando...' : 'Crear usuario'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal editar roles */}
      <Dialog open={!!openEditar} onOpenChange={v => !v && setOpenEditar(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar roles — {openEditar?.full_name}</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardarRoles} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Roles asignados</Label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button type="button" key={r}
                    onClick={() => toggleRol(r, rolesEditar, setRolesEditar)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      rolesEditar.includes(r)
                        ? 'bg-[#0f1b35] text-white border-[#0f1b35]'
                        : 'border-muted-foreground/30 text-muted-foreground hover:border-foreground'
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={rolesEditar.length === 0}>
              Guardar roles
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
          ) : (
            <div className="divide-y">
              {usuarios.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{u.full_name}</p>
                      {!u.is_active && <Badge variant="secondary" className="text-xs">Suspendido</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {u.roles?.map(r => (
                        <Badge key={r} variant="outline" className="text-xs">{ROLE_LABELS[r as Role]}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setOpenEditar(u); setRolesEditar(u.roles ?? []) }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Editar roles"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActivo(u)}
                      className={`p-1.5 rounded transition-colors ${
                        u.is_active
                          ? 'hover:bg-red-50 text-muted-foreground hover:text-red-600'
                          : 'hover:bg-green-50 text-muted-foreground hover:text-green-600'
                      }`}
                      title={u.is_active ? 'Suspender usuario' : 'Reactivar usuario'}
                    >
                      {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
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
