'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import RoleSwitcher from '@/components/layout/RoleSwitcher'
import type { Role, UserProfile } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeRole, setActiveRole] = useState<Role>('vendedor')

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setActiveRole(data.active_role)
      }
    }
    loadProfile()
  }, [router])

  async function handleRoleChange(role: Role) {
    setActiveRole(role)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ active_role: role })
      .eq('id', profile?.id)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeRole={activeRole} />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile.full_name}</span>
            <RoleSwitcher
              roles={profile.roles}
              activeRole={activeRole}
              onRoleChange={handleRoleChange}
            />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
