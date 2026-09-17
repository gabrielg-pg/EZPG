// Calcula a segunda-feira (início) da semana de uma data
export function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay() // 0 = domingo, 1 = segunda ...
  const diff = day === 0 ? -6 : 1 - day // volta até a segunda-feira
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split("T")[0]
}
