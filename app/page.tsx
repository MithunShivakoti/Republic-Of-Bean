"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Leaf, MapPin, Flag, FileText, Volume2, VolumeX, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAgentContext } from "@/providers/agent-provider"

export default function Home() {
  const router = useRouter()
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isNarrationComplete, setIsNarrationComplete] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [displayedText, setDisplayedText] = useState("")
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [audioEnabled, setAudioEnabled] = useState(true) // Default to enabled
  const [introComplete, setIntroComplete] = useState(false)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const segmentTimerRef = useRef<NodeJS.Timeout | null>(null)
  const typingSpeed = 50 // ms per character
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [resetGame, setResetGame] = useState(false)
  const { resetGameState } = useAgentContext() || {} // Initialize with empty object to avoid conditional hook call

  // Updated narration script in two-line segments
  const narrationSegments = [
    "Welcome to the Republic of Bean, my country… a land where everything is free, but nothing is simple.",
    "We have one language, one history… the Grapes' history. It's always about the Grapes, no matter what.",
    "But my people, the Curly Hairs, we just want our children to learn in our language too, to preserve our culture.",
    "Then came the refugees—two million of them—fleeing war and chaos. Sure, it brought more challenges, but they need us.",
    "Despite protests and corruption still lingering, we've always held on.",
    "Now, there's hope—education reform. 14 units. 7 decisions. The future of our nation depends on what we choose.",
    "But we must try, for all Beans. We have to make it work, together.",
  ]

  // Full narration text for transcript
  const narrationText = narrationSegments.join(" ")

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis

      // Some browsers require a user interaction before allowing speech synthesis
      // We'll set up a one-time click handler to initialize speech synthesis
      const handleUserInteraction = () => {
        try {
          // Try to speak a silent utterance to initialize the speech synthesis
          const utterance = new SpeechSynthesisUtterance("")
          utterance.volume = 0
          speechSynthRef.current?.speak(utterance)

          // Remove the event listener after first interaction
          document.removeEventListener("click", handleUserInteraction)
        } catch (error) {
          console.error("Failed to initialize speech synthesis:", error)
        }
      }

      document.addEventListener("click", handleUserInteraction, { once: true })
    } else {
      console.warn("Speech synthesis not available in this browser")
      setAudioEnabled(false)
    }

    return () => {
      // Clean up speech synthesis
      stopNarration()
    }
  }, [])

  // Load Lottie script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs"
    script.type = "module"
    script.onload = () => setIsScriptLoaded(true)
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Start intro animation and narration on component mount
  useEffect(() => {
    // Short delay before starting the intro animation
    const timer = setTimeout(() => {
      setIntroComplete(true)
      // Start narration after a short delay
      setTimeout(() => {
        startNarration()
      }, 500)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Simple typing effect function
  const typeText = (text: string, onComplete: () => void) => {
    let i = 0
    setDisplayedText("")

    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }

    // Start typing
    typingIntervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1))
        i++
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current)
        }
        // Wait a moment after typing completes
        setTimeout(onComplete, 1000)
      }
    }, typingSpeed)
  }

  // Function to speak text with Mr. Bean voice characteristics
  const speakText = (text: string) => {
    if (!audioEnabled || !speechSynthRef.current) return false

    try {
      // Cancel any ongoing speech
      if (speechSynthRef.current.speaking) {
        speechSynthRef.current.cancel()
      }

      // Create and configure the utterance for Mr. Bean-like voice
      const utterance = new SpeechSynthesisUtterance(text)

      // Mr. Bean voice characteristics - higher pitch, slightly faster rate
      utterance.pitch = 1.4 // Higher pitch for Mr. Bean's somewhat nasal voice
      utterance.rate = 0.9 // Slightly slower for his deliberate speech pattern
      utterance.volume = 1

      // Try to get a British English voice if available
      const voices = speechSynthRef.current.getVoices()
      const britishVoice = voices.find((voice) => voice.lang.includes("en-GB") || voice.name.includes("British"))

      if (britishVoice) {
        utterance.voice = britishVoice
      }

      // Store the current utterance
      currentUtteranceRef.current = utterance

      // Speak the text
      speechSynthRef.current.speak(utterance)

      console.log("Speaking as Mr. Bean:", text.substring(0, 20) + "...")
      return true
    } catch (error) {
      console.error("Speech synthesis error:", error)
      return false
    }
  }

  // Function to move to the next segment
  const moveToNextSegment = (index: number) => {
    // Clear any existing timers
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current)
      segmentTimerRef.current = null
    }

    if (index < narrationSegments.length) {
      setCurrentSegmentIndex(index)
      const currentText = narrationSegments[index]

      // Try to speak the segment if audio is enabled
      if (audioEnabled) {
        speakText(currentText)
      }

      // Type the next segment
      typeText(currentText, () => {
        // Calculate reading time based on text length
        const readingTimeMs = Math.max(1000, currentText.length * 15) // Reduced to 1 second minimum and 15ms per character

        // After typing is complete, wait for "reading time" before moving to next segment
        segmentTimerRef.current = setTimeout(() => {
          moveToNextSegment(index + 1)
        }, readingTimeMs)
      })
    } else {
      // All segments complete
      setIsSpeaking(false)
      setIsNarrationComplete(true)
      setDisplayedText("")
    }
  }

  // Start narration with typing effect and speech
  const startNarration = () => {
    setIsSpeaking(true)
    setCurrentSegmentIndex(0)
    setIsNarrationComplete(false)

    // Cancel any ongoing speech
    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      try {
        speechSynthRef.current.cancel()
      } catch (error) {
        console.error("Error canceling speech:", error)
      }
    }

    // Start with the first segment
    moveToNextSegment(0)
  }

  const stopNarration = () => {
    setIsSpeaking(false)
    setDisplayedText("")

    // Stop speech synthesis
    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      try {
        speechSynthRef.current.cancel()
      } catch (error) {
        console.error("Error canceling speech:", error)
      }
    }

    // Stop typing
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }

    // Clear any segment timers
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current)
      segmentTimerRef.current = null
    }
  }

  const replayNarration = () => {
    stopNarration()
    setTimeout(startNarration, 100)
  }

  const toggleTranscript = () => {
    // Stop narration when showing transcript
    if (!showTranscript) {
      stopNarration()
    }
    setShowTranscript(!showTranscript)
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)

    // If turning audio off while speaking, cancel current speech
    if (audioEnabled && isSpeaking && speechSynthRef.current && speechSynthRef.current.speaking) {
      try {
        speechSynthRef.current.cancel()
      } catch (error) {
        console.error("Error canceling speech:", error)
      }
    }

    // If turning audio on and currently narrating, speak the current segment
    if (!audioEnabled && isSpeaking && currentSegmentIndex < narrationSegments.length) {
      const currentText = narrationSegments[currentSegmentIndex]
      setTimeout(() => {
        speakText(currentText)
      }, 100)
    }
  }

  // Handle navigation - ensure audio stops when navigating away
  const handleNavigation = () => {
    stopNarration()

    // Reset game state when starting a new game
    if (typeof window !== "undefined") {
      // Clear all game-related storage
      localStorage.removeItem("beanBudgetUsage")
      localStorage.removeItem("beanDiscussionState")
      sessionStorage.removeItem("beanGameStarted")

      // Clear all policy discussions
      for (let i = 1; i <= 7; i++) {
        sessionStorage.removeItem(`discussion-${i}`)
      }
    }

    router.push("/user-data") // Changed from /information to /user-data
  }

  // Ensure audio stops when component unmounts
  useEffect(() => {
    return () => {
      stopNarration()
    }
  }, [])

  const handleStart = () => {
    // Reset game state when starting a new game
    setResetGame(true)
    router.push("/user-data") // Changed from /terms to /user-data
  }

  // Reset game state using context
  useEffect(() => {
    if (resetGame) {
      if (resetGameState) {
        resetGameState()
      }
      setResetGame(false) // Reset the trigger
    }
  }, [resetGame, resetGameState])

  return (
    <div className="min-h-screen flex flex-col bright-background">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <div className="bright-pattern"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto py-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/20 p-4 rounded-full shadow-lg border border-primary/30">
              <Leaf className="h-12 w-12 text-primary neon-text-primary" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4 neon-gradient-text">Welcome to Republic of Bean</h1>

          <div className="flex items-center justify-center gap-2 mb-8">
            <MapPin className="h-5 w-5 text-secondary neon-text-secondary" />
            <h2 className="text-2xl md:text-3xl font-medium text-secondary neon-text-secondary">The country of HOPE</h2>
          </div>

          {/* Bean Republic Logo/Image */}
          <div className="mb-8 flex justify-center">
            <div className="w-full max-w-md h-64 flex items-center justify-center rounded-lg border border-primary/30 shadow-lg bg-gradient-to-b from-primary/10 to-secondary/10">
              <Leaf className="h-24 w-24 text-primary neon-text-primary animate-pulse" />
            </div>
          </div>

          {/* Caption with typing effect */}
          {introComplete && (
            <div className="min-h-[120px] mb-6">
              <div className="caption-text max-w-2xl mx-auto">
                <p className="text-lg text-gray-100 neon-text whitespace-pre-line leading-relaxed">{displayedText}</p>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          {introComplete && isSpeaking && !isNarrationComplete && (
            <div className="mb-4">
              <div className="w-full bg-primary/10 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(currentSegmentIndex / narrationSegments.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {currentSegmentIndex + 1} of {narrationSegments.length}
              </p>
            </div>
          )}

          {/* Controls */}
          {introComplete && (
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                className="neon-button-secondary rounded-xl"
                onClick={isSpeaking ? stopNarration : startNarration}
              >
                {isSpeaking ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
                <span className="text-white">{isSpeaking ? "Stop" : "Start"} Narration</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="neon-button-secondary rounded-xl"
                onClick={replayNarration}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span className="text-white">Replay</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${audioEnabled ? "neon-button" : "neon-button-secondary"} rounded-xl`}
                onClick={toggleAudio}
              >
                {audioEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                <span className="text-white">Audio {audioEnabled ? "On" : "Off"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="neon-button-secondary rounded-xl"
                onClick={toggleTranscript}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className="text-white">Show Transcript</span>
              </Button>
            </div>
          )}

          {/* Begin Journey Button - Disabled until narration completes */}
          {introComplete && (
            <div className="relative">
              <Button
                size="lg"
                className={`text-lg px-8 py-6 rounded-full shadow-lg transition-all hover-lift ${
                  isNarrationComplete || showTranscript
                    ? "neon-button"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-70"
                }`}
                disabled={!isNarrationComplete && !showTranscript}
                aria-disabled={!isNarrationComplete && !showTranscript}
                onClick={() => {
                  if (isNarrationComplete || showTranscript) {
                    // Stop narration when button is clicked
                    stopNarration()
                    handleNavigation()
                  }
                }}
              >
                <Flag className="mr-2 h-5 w-5" />
                <span className="text-white">
                  {isNarrationComplete || showTranscript ? "Begin Your Journey" : "Please Listen to Introduction"}
                </span>
              </Button>

              {/* Overlay to prevent clicking when disabled */}
              {!isNarrationComplete && !showTranscript && (
                <div
                  className="absolute inset-0 bg-transparent"
                  onClick={(e) => e.preventDefault()}
                  aria-hidden="true"
                ></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Dialog */}
      <Dialog
        open={showTranscript}
        onOpenChange={(open) => {
          setShowTranscript(open)
          if (!open) {
            // If closing the transcript dialog, ensure narration is stopped
            stopNarration()
            setIsNarrationComplete(true)
          }
        }}
      >
        <DialogContent className="dark-card border-primary/30 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold neon-text mb-4">Full Transcript</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4 text-container rounded-xl">
            <p className="text-sm text-gray-100">{narrationText}</p>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              className="neon-button rounded-xl"
              onClick={() => {
                setShowTranscript(false)
                stopNarration()
                setIsNarrationComplete(true)
              }}
            >
              <span className="text-white">Continue</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="py-4 text-center text-sm text-gray-100 border-t dark-footer relative z-10 neon-text">
        Republic of Bean Parliamentary Simulation &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
