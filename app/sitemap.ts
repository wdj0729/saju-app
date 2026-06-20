import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/saju`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/fortune`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/fortune/yearly`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/compatibility`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/compatibility/group`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
