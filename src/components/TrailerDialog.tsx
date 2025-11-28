import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface TrailerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const TrailerDialog = ({ open, onOpenChange }: TrailerDialogProps) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      if (containerRef.current) {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: 'beo0oHLZefY',
          playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
          },
          events: {
            onStateChange: (event: any) => {
              // YT.PlayerState.ENDED = 0
              if (event.data === 0) {
                onOpenChange(false);
              }
            },
          },
        });
      }
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-auto p-0">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div
            id="youtube-player"
            ref={containerRef}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
