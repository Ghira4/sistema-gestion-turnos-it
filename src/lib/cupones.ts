// Genera un código único de cupón: TIT-XXXXX
// Usa las iniciales del emisor + receptor + entropy para que sea irrepetible
export function generarCodigo(emisorNombre: string, receptorNombre: string): string {
  const initEmisor = emisorNombre.trim().split(' ').map(p => p[0] ?? 'X').join('').toUpperCase().slice(0, 2)
  const initReceptor = receptorNombre.trim().split(' ').map(p => p[0] ?? 'X').join('').toUpperCase().slice(0, 2)
  const entropy = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `TIT-${initEmisor}${initReceptor}${entropy}`
}
