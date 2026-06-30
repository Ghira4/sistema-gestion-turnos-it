import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Ticket, CalendarCheck, DollarSign } from 'lucide-react'

const stats = [
  { label: 'Usuarios activos', value: '—', icon: Users },
  { label: 'Cupones generados', value: '—', icon: Ticket },
  { label: 'Turnos pendientes', value: '—', icon: CalendarCheck },
  { label: 'Ingresos del mes', value: '—', icon: DollarSign },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumen general en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm text-center py-8">
            Los módulos se irán completando en los próximos sprints.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
