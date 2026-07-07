import { Badge } from '@/components/ui/badge'

const estadoConfig = {
  pendiente:  { label: 'Pendiente',   className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmado: { label: 'Confirmado',  className: 'bg-blue-100 text-blue-800 border-blue-200' },
  rechazado:  { label: 'Rechazado',   className: 'bg-red-100 text-red-800 border-red-200' },
  listo:      { label: 'Listo',       className: 'bg-green-100 text-green-800 border-green-200' },
  abonado:    { label: 'Abonado',     className: 'bg-purple-100 text-purple-800 border-purple-200' },
}

export default function EstadoBadge({ estado }: { estado: string }) {
  const config = estadoConfig[estado as keyof typeof estadoConfig] ?? { label: estado, className: '' }
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
