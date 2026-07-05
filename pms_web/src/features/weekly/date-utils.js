export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/** Returns the Monday of the week containing `date` (local time), as an ISO date string. */
export function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/** Returns an array of 7 ISO date strings starting from `mondayISO`. */
export function getWeekDates(mondayISO) {
  const monday = new Date(mondayISO + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

export function addDaysISO(dateISO, days) {
  const d = new Date(dateISO + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function formatWeekdayLabel(index) {
  return WEEKDAY_LABELS[index];
}

export function formatDateShort(dateISO) {
  const d = new Date(dateISO + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeekRange(mondayISO, sundayISO) {
  const monday = new Date(mondayISO + 'T00:00:00');
  const sunday = new Date(sundayISO + 'T00:00:00');
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const startLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = sunday.toLocaleDateString('en-US', {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `${startLabel} – ${endLabel}`;
}

export function isToday(dateISO) {
  return dateISO === toISODate(new Date());
}
