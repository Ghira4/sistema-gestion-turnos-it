import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumenCardProps {
  titulo: string
  monto: number
  subtitulo?: string
  icon: LucideIcon
  color?: 'green' | 'red' | 'blue' | 'yellow'
}

const colorMap = {
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'text-red-500' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-500' },
}

function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function ResumenCard({ titulo, monto, subtitulo, icon: Icon, color = 'blue' }: ResumenCardProps) {
  const c = colorMap[color]
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <div className={cn('p-2 rounded-lg', c.bg)}>
          <Icon className={cn('w-4 h-4', c.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-bold', c.text)}>{formatMonto(monto)}</p>
        {subtitulo && <p className="text-xs text-muted-foreground mt-1">{subtitulo}</p>}
      </CardContent>
    </Card>
  )
}
