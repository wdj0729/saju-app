import { redis } from './upstash';
import type { PillarData } from './stream-anthropic';

function pillarKey(pillars: {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData | null;
}): string {
  const h = pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : 'x';
  return `${pillars.year.gan}${pillars.year.ji}.${pillars.month.gan}${pillars.month.ji}.${pillars.day.gan}${pillars.day.ji}.${h}`;
}

export function makeSajuAnalysisCacheKey(
  pillars: { year: PillarData; month: PillarData; day: PillarData; hour: PillarData | null },
  gender: 'M' | 'F' | undefined,
  birthYear: number,
  todayYear: number
): string {
  return `server-ai:saju:v1:${pillarKey(pillars)}-${gender ?? 'x'}-${birthYear}-${todayYear}`;
}

export function makeAiAnalysisCacheKey(
  pillars: { year: PillarData; month: PillarData; day: PillarData; hour: PillarData | null },
  todayYear: number,
  todayMonth: number,
  todayDay: number
): string {
  return `server-ai:fortune:v1:${pillarKey(pillars)}:${todayYear}-${todayMonth}-${todayDay}`;
}

export function makeYearlyFortuneCacheKey(
  pillars: { year: PillarData; month: PillarData; day: PillarData; hour: PillarData | null },
  gender: 'M' | 'F' | undefined,
  fortuneYear: number
): string {
  return `server-ai:yearly:v1:${pillarKey(pillars)}-${gender ?? 'x'}-${fortuneYear}`;
}

export async function getRedisAiCache(key: string): Promise<string | null> {
  try {
    const val = await redis.get<string>(key);
    return val ?? null;
  } catch {
    return null;
  }
}

export async function setRedisAiCache(key: string, text: string, ttlSeconds = 2592000): Promise<void> {
  try {
    await redis.set(key, text, { ex: ttlSeconds });
  } catch {
    // Redis 실패가 응답을 막지 않도록 무시
  }
}
