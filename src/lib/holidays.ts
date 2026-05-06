import { isHoliday } from 'korean-holidays'

// dateStr: "YYYY-MM-DD"
export function getHolidayName(dateStr: string): string | null {
  const [y, m, d] = dateStr.split('-').map(Number)
  const holiday = isHoliday(new Date(y, m - 1, d))
  return holiday ? holiday.nameKo : null
}
