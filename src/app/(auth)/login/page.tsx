'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [recordar, setRecordar] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    if (recordar) {
      localStorage.setItem('turnosit_email', email)
    } else {
      localStorage.removeItem('turnosit_email')
    }

    router.push('/dashboard')
  }

  // Cargar email guardado al montar
  useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('turnosit_email') : null
    if (saved) { setEmail(saved); setRecordar(true) }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1b35] px-4">
      <Card className="w-full max-w-sm border-0 shadow-2xl">
        <CardHeader className="items-center pb-2">
          <div className="w-24 h-24 relative mb-2">
            <Image
              src="/logo.png"
              alt="Turnos IT"
              fill
              sizes="96px"
              className="object-contain"
            />
          </div>
          <CardTitle className="text-xl font-bold text-center">Turnos IT</CardTitle>
          <p className="text-sm text-muted-foreground text-center">Sistema de Gestión Interna</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@turnosit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="recordar"
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#0f1b35] cursor-pointer"
              />
              <Label htmlFor="recordar" className="text-sm font-normal cursor-pointer select-none">
                Recordar mi email
              </Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full bg-[#0f1b35] hover:bg-[#1a2d55]" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
