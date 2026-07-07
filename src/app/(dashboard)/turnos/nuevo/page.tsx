import NuevoTurnoForm from '@/components/turnos/NuevoTurnoForm'

export default function NuevoTurnoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo turno</h1>
        <p className="text-sm text-muted-foreground">Cargá los datos del cliente y el turno a gestionar</p>
      </div>
      <NuevoTurnoForm />
    </div>
  )
}
