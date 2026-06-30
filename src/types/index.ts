export type Role =
  | 'admin'
  | 'jefe'
  | 'supervisor'
  | 'vendedor'
  | 'gestor'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  roles: Role[]
  active_role: Role
  is_active: boolean
  created_at: string
}

export interface TurnoEstado {
  id: string
  label: string
}

export type TurnoTipo = 'CIE' | 'CIUDADANIA' | 'PASAPORTE'
export type TurnoOrigen = 'asesor' | 'redes_sociales' | 'ciudadania_italiana'

export interface Consulado {
  id: string
  nombre: string
  ciudad: string
  pais: string
  created_at: string
}

export interface Cupon {
  id: string
  codigo: string
  emisor_id: string
  receptor_nombre: string
  receptor_contacto: string
  canjeado: boolean
  turno_id?: string
  created_at: string
  emisor?: UserProfile
}

export interface Turno {
  id: string
  consulado_id: string
  tipo: TurnoTipo
  origen: TurnoOrigen
  cliente_nombre: string
  cliente_contacto: string
  datos_adicionales: Record<string, string>
  cupon_id?: string
  precio_original: number
  precio_final: number
  estado: 'pendiente' | 'confirmado' | 'rechazado' | 'listo' | 'abonado'
  fecha_solicitud: string
  fecha_turno?: string
  fecha_confirmacion?: string
  vendedor_id?: string
  gestor_id?: string
  archivos?: string[]
  created_at: string
  consulado?: Consulado
  cupon?: Cupon
  vendedor?: UserProfile
}

export interface Gasto {
  id: string
  descripcion: string
  monto: number
  categoria: string
  fecha: string
  registrado_por: string
  created_at: string
}
