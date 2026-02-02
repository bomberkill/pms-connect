"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowLeft,
  MoreVertical,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaType } from "@/types/Post";
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MediaItem } from "@/types/Post";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { useDictionary } from "@/hooks/use-dictionary";
import { Slider } from "./ui/slider";

const SWIPE_CONFIDENCE_THRESHOLD = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    };
  },
};

export function PostMedia({ media }: { media?: MediaItem[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [[page, direction], setPage] = useState([0, 0]);

  const dict = useDictionary();
  const isMobile = useIsMobile();

  if (!media || media.length === 0) return null;

  const selected = selectedIndex !== null ? media[selectedIndex] : null;

  const handleOpen = (index: number) => {
    setSelectedIndex(index);
    setPage([index, 0]);
  };
  const handleClose = () => setSelectedIndex(null);

  const paginate = (newDirection: number) => {
    if (selectedIndex === null) return;
    const newIndex = selectedIndex + newDirection;
    if (newIndex < 0 || newIndex >= media.length) return;

    setPage([newIndex, newDirection]);
    setSelectedIndex(newIndex);
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const power = swipePower(offset.x, velocity.x);

    if (power < -SWIPE_CONFIDENCE_THRESHOLD) {
      paginate(1);
    } else if (power > SWIPE_CONFIDENCE_THRESHOLD) {
      paginate(-1);
    }
  };

  return (
    <>
      {/* Grille principale */}
      <div
        className={cn(
          "mt-3 grid gap-1 overflow-hidden rounded-md",
          media.length === 1 && "grid-cols-1",
          media.length === 2 && "grid-cols-2",
          media.length >= 3 && "grid-cols-3"
        )}
      >
        {media.map((m, index) => (
          <MediaPreview key={m.url} media={m} onClick={() => handleOpen(index)} />
        ))}
      </div>

      {/* Lightbox plein écran */}
      <AnimatePresence initial={false} custom={direction}>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header for the fullscreen view */}
            <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/10 hover:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                    <MoreVertical className="w-6 h-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={selected.url} download>
                      {dict.actions.download}
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>

            <div
              className="relative flex-1 flex items-center justify-center h-full w-full overflow-hidden"
              onClick={handleClose} // Close when clicking the background
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={page}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={handleDragEnd}
                  className="absolute w-full h-full flex items-center justify-center"
                >
                  {selected.type === MediaType.DOCUMENT && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white/10 md:p-8">
                      <iframe
                        src={selected.url}
                        className="w-full h-full rounded-lg bg-white shadow-2xl"
                        title="Document Viewer"
                      />
                    </div>
                  )}

                  {selected.type === MediaType.IMAGE && (
                    <img
                      src={selected.url}
                      alt="Full media"
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "object-contain",
                        isMobile ? "max-h-full max-w-full" : "max-h-[90vh] max-w-[90vw]"
                      )}
                    />
                  )}

                  {selected.type === MediaType.VIDEO && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={cn("relative flex items-center justify-center", isMobile ? "w-full h-full" : "w-[55vw] h-auto")}
                    >
                      <VideoPlayer media={selected} isMobile={isMobile} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


function VideoPlayer({ media, isMobile }: { media: MediaItem; isMobile: boolean }) {
  const dict = useDictionary();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Autoplay
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState("1");

  // Reset state when media source changes
  useEffect(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, [media.url]);


  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.play();
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted && videoRef.current.volume === 0) {
        setVolume(1); // Restore volume if it was 0
        videoRef.current.volume = 1;
      }
    }
  };

  const handlePlaybackRateChange = (rate: string) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = Number(rate);
      setPlaybackRate(rate);
    }
  };

  const handleVolumeUpdate = useCallback(() => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src={media.url}
        autoPlay
        muted // Autoplay is more reliable when muted initially
        className="w-full h-full object-contain"
        onClick={handlePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnd}
        onVolumeChange={handleVolumeUpdate}
      />

      {/* Custom Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300",
        isMobile ? "px-2 py-1" : "px-4 py-2"
      )}>
        <Slider
          min={0}
          max={duration || 1}
          step={1}
          value={[currentTime]}
          onValueChange={handleSeek}
          className="w-full h-2 mb-2"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePlayPause} className="text-white hover:bg-white/10 hover:text-white">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleMuteToggle} className="text-white hover:bg-white/10 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </Button>

            {!isMobile && (
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            )}

            <span className="text-sm w-28">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                  <Settings2 className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end">
                  <DropdownMenuSub>
                    <DropdownMenuTrigger>{dict.post.speed}</DropdownMenuTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup value={playbackRate} onValueChange={handlePlaybackRateChange}>
                          {["0.5", "1", "1.5", "2"].map((rate) => (
                            <DropdownMenuRadioItem key={rate} value={rate}>
                              {rate}x
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}

/* --- Sous composant : miniature du média --- */
function MediaPreview({
  media,
  onClick,
}: {
  media: MediaItem;
  onClick: () => void;
}) {
  const dict = useDictionary();
  const [duration, setDuration] = useState<number | null>(null);
  if (media.type === MediaType.IMAGE)
    return (
      <img
        src={media.url}
        onClick={onClick}
        alt={dict.common.preview}
        className="w-full h-60 object-cover rounded-md cursor-pointer hover:opacity-90 transition"
      />
    );

  if (media.type === MediaType.VIDEO)
    return (
      <div
        className="relative w-full h-60 bg-black rounded-md overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        <video
          src={media.url}
          className="w-full h-full object-cover"
          onLoadedMetadata={(e) =>
            setDuration(e.currentTarget.duration)
          }
          muted
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <Play className="w-12 h-12 text-white" />
        </div>

        {duration && (
          <span className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
            {formatTime(duration)}
          </span>
        )}
      </div>
    );

  // Documents (PDF, autres)
  if (media.type === MediaType.DOCUMENT) return (
    <div
      onClick={onClick}
      className="w-full h-60 bg-muted border border-border flex flex-col items-center justify-center rounded-md cursor-pointer hover:bg-muted/80 transition group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 bg-red-500 text-white text-[10px] font-bold rounded-bl-lg shadow-sm">
        {dict.common.pdf}
      </div>
      <div className="p-4 bg-card rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
        <FileIcon className="w-8 h-8 text-red-500" />
      </div>
      <span className="text-sm font-medium text-foreground text-center px-4 line-clamp-2 break-words max-w-full">
        {media.url.split("/").pop() || dict.post.pdfDocument}
      </span>
      <span className="text-xs text-muted-foreground mt-1">
        {dict.post.clickToView}
      </span>
    </div>
  );
  return null;
}



function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" + s : s}`;
}
