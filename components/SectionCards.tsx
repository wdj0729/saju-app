'use client';

import { SkeletonBox } from './Skeleton';

interface SectionCardsProps<K extends string> {
  keys: readonly K[];
  meta: Record<K, { emoji: string; title: string }>;
  sections: Record<K, string>;
  activeSection: K | null;
  isStreaming: boolean;
}

export function SectionCards<K extends string>({
  keys,
  meta,
  sections,
  activeSection,
  isStreaming,
}: SectionCardsProps<K>) {
  return (
    <>
      {keys.map((key) => {
        const { emoji, title } = meta[key];
        const text = sections[key];
        return (
          <div key={key} className="bg-card rounded-2xl p-4">
            <p className="text-xs text-muted mb-2">
              {emoji} {title}
            </p>
            {isStreaming && !text ? (
              <div className="flex flex-col gap-2">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-[80%]" />
                <SkeletonBox className="h-4 w-[60%]" />
              </div>
            ) : (
              <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                {text}
                {activeSection === key && <span className="animate-pulse opacity-70">▌</span>}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}
