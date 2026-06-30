'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Ticket,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Users,
  Building2,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'jefe', 'supervisor', 'vendedor', 'gestor'] },
  { href: '/cupones', label: 'Cupones', icon: Ticket, roles: ['admin', 'jefe', 'supervisor', 'vendedor'] },
  { href: '/turnos', label: 'Gestión de Turnos', icon: CalendarCheck, roles: ['admin', 'jefe', 'supervisor', 'gestor'] },
  { href: '/ganancias', label: 'Ganancias', icon: TrendingUp, roles: ['admin', 'jefe'] },
  { href: '/gastos', label: 'Gastos', icon: TrendingDown, roles: ['admin', 'jefe'] },
  { href: '/informes', label: 'Informes', icon: BarChart2, roles: ['admin', 'jefe', 'supervisor'] },
  { href: '/consulados', label: 'Consulados', icon: Building2, roles: ['admin', 'jefe', 'supervisor'] },
  { href: '/usuarios', label: 'Usuarios', icon: Users, roles: ['admin', 'jefe'] },
]

interface SidebarProps {
  activeRole: Role
}

export default function Sidebar({ activeRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(activeRole)
  )

  return (
    <aside className="w-64 min-h-screen bg-[#0f1b35] text-white flex flex-col">
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Sistema</p>
        <p className="font-bold text-lg">Turnos IT</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-white/15 text-white font-medium'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
