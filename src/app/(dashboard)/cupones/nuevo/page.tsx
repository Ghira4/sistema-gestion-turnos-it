'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import GeneradorCupon from '@/components/cupones/GeneradorCupon'

export default function NuevoCuponPage() {
  const [perfil, setPerfil] = useState<{ id: string; full_name: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('id, full_name').eq('id', user.id).single()
      if (data) setPerfil(data)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generar cupón</h1>
        <p className="text-sm text-muted-foreground">El código se imprime sobre la plantilla oficial de Turnos IT</p>
      </div>
      {perfil ? (
        <GeneradorCupon emisorNombre={perfil.full_name} emisorId={perfil.id} />
      ) : (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      )}
    </div>
  )
}
