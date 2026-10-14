// Pure helpers for the free plan's daily translation counter (no React Native imports,
// so they can be checked with plain Node). One stored value { day, count }: a new UTC day
// reads as 0, so the count resets without piling up a key per day.

export const todayKey = (now: Date = new Date()): string => now.toISOString().slice(0, 10)

export function countFor(raw: string | null, today: string): number {
  if (!raw) return 0
  try {
    const saved = JSON.parse(raw)
    return saved?.day === today ? Math.max(0, Number(saved.count) || 0) : 0
  } catch {
    return 0
  }
}

export const serialiseCount = (today: string, count: number): string => JSON.stringify({ day: today, count })
