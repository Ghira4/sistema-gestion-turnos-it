import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, BarChart2 } from 'lucide-react'

const secciones = [
  {
    href: '/informes/vendedores',
    icon: Users,
    titulo: 'Informe de vendedores',
    descripcion: 'Cupones generados, conversión, turnos vendidos y dinero generado por cada asesor.',
  },
  {
    href: '/informes/pagos',
    icon: CreditCard,
    titulo: 'Liquidación de comisiones',
    descripcion: 'Comisiones a pagar a cada vendedor según los turnos abonados y su porcentaje asignado.',
  },
]

export default function InformesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Informes</h1>
        <p className="text-sm text-muted-foreground">Métricas y estadísticas de la empresa</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {secciones.map(({ href, icon: Icon, titulo, descripcion }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="p-2 rounded-lg bg-[#0f1b35]/10">
                  <Icon className="w-5 h-5 text-[#0f1b35]" />
                </div>
                <CardTitle className="text-base">{titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{descripcion}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
