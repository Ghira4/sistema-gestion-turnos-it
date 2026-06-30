'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import type { Role } from '@/types'

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  jefe: 'Jefe',
  supervisor: 'Supervisor',
  vendedor: 'Vendedor',
  gestor: 'Gestor',
}

interface RoleSwitcherProps {
  roles: Role[]
  activeRole: Role
  onRoleChange: (role: Role) => void
}

export default function RoleSwitcher({ roles, activeRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 text-sm outline-none">
        <Badge variant="secondary" className="cursor-pointer">
          {roleLabels[activeRole]}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {roles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => onRoleChange(role)}
            className={activeRole === role ? 'font-semibold' : ''}
          >
            {roleLabels[role]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
