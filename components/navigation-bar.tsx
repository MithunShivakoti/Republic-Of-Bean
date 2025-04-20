"use client"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface NavigationBarProps {
  duration: number
  currentTime: number
  isPlaying: boolean
  isMuted: boolean
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onMute: () => void
  onUnmute: () => void
  onSkipForward: () => void
  onSkipBack: () => void
}

export function NavigationBar({
  duration,
  currentTime,
  isPlaying,
  isMuted,
  onPlay,
  onPause,
  onSeek,
  onMute,
  onUnmute,
  onSkipForward,
  onSkipBack,
}: NavigationBarProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  return (
    <div className="w-full max-w-3xl bg-gray-100 dark:bg-gray-800 rounded-lg p-3 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">{formatTime(currentTime)}</span>
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          className="mx-4 flex-1"
          onValueChange={(value) => onSeek(value[0])}
        />
        <span className="text-sm">{formatTime(duration)}</span>
      </div>
      <div className="flex items-center justify-center space-x-4">
        <Button variant="ghost" size="icon" onClick={onSkipBack}>
          <SkipBack className="h-5 w-5" />
        </Button>
        {isPlaying ? (
          <Button variant="ghost" size="icon" onClick={onPause}>
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onPlay}>
            <Play className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onSkipForward}>
          <SkipForward className="h-5 w-5" />
        </Button>
        {isMuted ? (
          <Button variant="ghost" size="icon" onClick={onUnmute}>
            <VolumeX className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onMute}>
            <Volume2 className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
