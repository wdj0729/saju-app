import type { MessageStreamParams } from '@anthropic-ai/sdk/resources/messages/messages';
import { redis } from './upstash';
import { streamAnthropicResponseWithCache } from './stream-anthropic';
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

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30일

export async function setRedisAiCache(
  key: string,
  text: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  try {
    await redis.set(key, text, { ex: ttlSeconds });
  } catch {
    // Redis 실패가 응답을 막지 않도록 무시
  }
}

export async function streamAnthropicResponseWithRedisCache(
  params: MessageStreamParams,
  cacheKey: string,
  ttlSeconds: number
): Promise<Response> {
  const cached = await getRedisAiCache(cacheKey);
  if (cached) {
    return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  return streamAnthropicResponseWithCache(params, (text) =>
    setRedisAiCache(cacheKey, text, ttlSeconds)
  );
}
