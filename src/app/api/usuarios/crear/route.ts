import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usa la service role key para crear usuarios sin restricciones de auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password, full_name, roles } = await req.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Actualizar el profile con nombre y roles correctos
  await supabaseAdmin
    .from('profiles')
    .update({ full_name, roles, active_role: roles[0] })
    .eq('id', data.user.id)

  return NextResponse.json({ ok: true, id: data.user.id })
}
