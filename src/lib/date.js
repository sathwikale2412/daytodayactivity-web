/**
 * Task dates are stored as YYYY-MM-DD and must mean the user's calendar day.
 * toISOString() reads off UTC, so anyone east of Greenwich gets yesterday's
 * date between midnight and 05:30 (and the wrong bucket in analytics).
 */
export function toDateStr(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayStr() {
  return toDateStr(new Date());
}
