import { Gem, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HiddenGemBadgeProps {
  label?: string;
  className?: string;
}

export const HiddenGemBadge = ({ label = 'Local Secret', className }: HiddenGemBadgeProps) => (
  <span className={cn(
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
    "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    className
  )}>
    <Gem className="w-3 h-3" />
    {label}
  </span>
);

interface VideoSourcePlaceholderProps {
  videoUrl?: string;
  className?: string;
}

export const VideoSourcePlaceholder = ({ videoUrl, className }: VideoSourcePlaceholderProps) => (
  <div className={cn(
    "mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center gap-3",
    className
  )}>
    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
      <Play className="w-4 h-4 text-amber-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-amber-400">Source Video</div>
      {videoUrl ? (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground truncate block underline"
        >
          {videoUrl}
        </a>
      ) : (
        <div className="text-xs text-muted-foreground italic">Coming soon — video source link</div>
      )}
    </div>
  </div>
);
