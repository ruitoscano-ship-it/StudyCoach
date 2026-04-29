/** Segunda-feira 00:00 (hora local) da semana que contém `d`. */
export function startOfWeekMonday(d: Date) {
  const c = new Date(d);
  const day = c.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  c.setDate(c.getDate() + diff);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseWeekStartParam(s?: string) {
  if (!s) return startOfWeekMonday(new Date());
  const d = new Date(s + "T12:00:00");
  if (Number.isNaN(d.getTime())) return startOfWeekMonday(new Date());
  return startOfWeekMonday(d);
}
