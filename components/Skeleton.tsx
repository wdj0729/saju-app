export function SkeletonBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border rounded ${className ?? ''}`} />;
}
