'use client';
import { useState } from 'react';

interface ShareButtonProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  filename: string;
  shareTitle: string;
}

export default function ShareButton({ cardRef, filename, shareTitle }: ShareButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  async function handleShare() {
    if (!cardRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#1e1e2e',
        scale: window.devicePixelRatio || 2,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('캡처 실패'))), 'image/png');
      });
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('공유 실패:', err);
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={isCapturing}
      className="bg-card text-muted py-3 px-4 rounded-2xl hover:bg-card-hover transition-colors disabled:opacity-50"
      aria-label="결과 공유하기"
    >
      {isCapturing ? '⏳' : '⬆'}
    </button>
  );
}
