import { Badge } from '@/components/ui/badge'

const origenConfig = {
  asesor:              { label: 'Asesor',               className: 'bg-indigo-100 text-indigo-800' },
  redes_sociales:      { label: 'Redes Sociales',       className: 'bg-pink-100 text-pink-800' },
  ciudadania_italiana: { label: 'Ciudadanía Italiana',  className: 'bg-orange-100 text-orange-800' },
}

export default function OrigenBadge({ origen }: { origen: string }) {
  const config = origenConfig[origen as keyof typeof origenConfig] ?? { label: origen, className: '' }
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
