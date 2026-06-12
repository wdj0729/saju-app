import Link from 'next/link';

interface BackButtonProps {
  href: string;
  label: string;
}

export default function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link href={href} className="text-muted text-sm hover:text-primary transition-colors">
      ← {label}
    </Link>
  );
}
