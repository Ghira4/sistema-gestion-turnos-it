'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface SelectorMesProps {
  año: number
  mes: number // 0-based
  onChange: (año: number, mes: number) => void
}

export default function SelectorMes({ año, mes, onChange }: SelectorMesProps) {
  function anterior() {
    if (mes === 0) onChange(año - 1, 11)
    else onChange(año, mes - 1)
  }
  function siguiente() {
    const hoy = new Date()
    if (año === hoy.getFullYear() && mes === hoy.getMonth()) return
    if (mes === 11) onChange(año + 1, 0)
    else onChange(año, mes + 1)
  }

  const esMesActual = (() => {
    const hoy = new Date()
    return año === hoy.getFullYear() && mes === hoy.getMonth()
  })()

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={anterior}><ChevronLeft className="w-4 h-4" /></Button>
      <span className="text-sm font-medium min-w-[130px] text-center">{MESES[mes]} {año}</span>
      <Button variant="outline" size="icon" onClick={siguiente} disabled={esMesActual}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
