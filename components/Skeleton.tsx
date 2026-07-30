export function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border rounded ${className ?? ''}`} />;
}

export function SkeletonHeader({ titleWidth }: { titleWidth: string }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
      <SkeletonBox className="h-4 w-16" />
      <SkeletonBox className={`h-4 ${titleWidth}`} />
    </header>
  );
}
