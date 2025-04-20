"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Volume2, VolumeX, Send, Lock } from "lucide-react"
import { getAgentResponse, getAgentResponseToUser } from "@/lib/openai-service"
import { useAgentContext } from "@/providers/agent-provider"
import { usePolicyContext } from "@/providers/policy-provider"
import { AgentSelector } from "@/components/agent-selector"
import { policyQuestions } from "@/data/policy-questions"

// Add this function at the beginning of the file, after the imports
export function resetGameState() {
  // Clear all game-related storage
  localStorage.removeItem("beanPolicyBudgetUsage")
  localStorage.removeItem("beanDiscussionState")
  sessionStorage.removeItem("beanGameStarted")
  localStorage.removeItem("beanDiscussionUnits")

  // Clear all policy discussions
  for (let i = 1; i <= 7; i++) {
    sessionStorage.removeItem(`discussion-${i}`)
  }
}

interface Message {
  id: string
  role: "user" | "agent" | "moderator"
  content: string
  agentId?: string
  timestamp: Date
}

interface BudgetUsage {
  [key: string]: number
}

// Fallback response function
const getFallbackResponse = (agentId: string, policyId: number) => {
  switch (agentId) {
    case "agent1":
      return "I believe a balanced approach is best for this policy."
    case "agent2":
      return "We must prioritize inclusive options to support everyone."
    case "agent3":
      return "A comprehensive solution is needed to address this issue effectively."
    case "agent4":
      return "I think we should focus on the most practical and cost-effective solution."
    default:
      return "I have no strong feelings about this policy."
  }
}

// Update the getAdjustedAgentVote function to be less strict with budget constraints
const getAdjustedAgentVote = (agentId: string, policyId: number, preferredOption: number): number => {
  // Get the current policy
  const policy = policyQuestions.find((p) => p.id === policyId)
  if (!policy) return 1 // Default to cheapest option if policy not found

  // Get budget usage from localStorage
  let budgetUsage: BudgetUsage = {
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  }
  try {
    const savedBudgetUsage = localStorage.getItem("beanPolicyBudgetUsage")
    if (savedBudgetUsage) {
      budgetUsage = JSON.parse(savedBudgetUsage)
    }
  } catch (error) {
    console.error("Error parsing budget usage:", error)
  }

  // Calculate remaining budget for this agent
  const agentBudget = budgetUsage[agentId] || 0
  const remainingBudget = 14 - agentBudget

  // Calculate remaining policies (including current one)
  const remainingPolicies = 7 - policyId + 1

  // Minimum budget needed for remaining policies (1 unit per policy)
  const minimumBudgetNeeded = remainingPolicies

  // If remaining budget is less than minimum needed, force option 1
  // But be more lenient to allow for more variety
  if (remainingBudget < minimumBudgetNeeded - 1) {
    // Changed from <= minimumBudgetNeeded
    return 1 // Must choose option 1 for all remaining policies
  }

  // Get the weights of all options
  const option1Weight = policy.options.find((o) => o.id === 1)?.weight || 1
  const option2Weight = policy.options.find((o) => o.id === 2)?.weight || 2
  const option3Weight = policy.options.find((o) => o.id === 3)?.weight || 3

  // Get the weight of the preferred option
  const preferredOptionWeight = policy.options.find((o) => o.id === preferredOption)?.weight || 0

  // Calculate how much budget would be left after this choice
  const budgetAfterChoice = remainingBudget - preferredOptionWeight

  // Calculate how much budget is needed for remaining policies after this one
  const remainingPoliciesAfterThis = remainingPolicies - 1

  // Check if selecting this option would leave enough for remaining questions
  // Be more lenient to allow for more variety
  if (budgetAfterChoice >= remainingPoliciesAfterThis - 1) {
    // Added -1 to be more lenient
    // Can afford this option and still have enough for remaining questions
    return preferredOption
  } else if (
    preferredOption === 3 &&
    budgetAfterChoice + (option3Weight - option2Weight) >= remainingPoliciesAfterThis - 1 // Added -1 to be more lenient
  ) {
    // Try option 2 instead
    return 2
  } else {
    // Must choose option 1 to ensure enough budget for remaining questions
    return 1
  }
}

export default function DiscussionPage() {
  const router = useRouter()
  const { id } = useParams()
  const policyId = Array.isArray(id) ? Number.parseInt(id[0]) || 1 : Number.parseInt(id as string) || 1
  const { agents, userVote, agentVotes, discussionState } = useAgentContext()
  const { policies, totalWeight } = usePolicyContext()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true) // Default to enabled
  const [initialOpinionsLoaded, setInitialOpinionsLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [currentTypingMessage, setCurrentTypingMessage] = useState<Message | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [typingSpeed] = useState(70) // Faster typing speed (70ms per character)
  const isSpeakingRef = useRef(false)
  const audioInitializedRef = useRef(false)
  const budgetInitializedRef = useRef(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Budget tracking
  const [budgetUsage, setBudgetUsage] = useState<BudgetUsage>({
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  })

  // Add separate state for discussion units
  const [discussionUnits, setDiscussionUnits] = useState<BudgetUsage>({
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  })
  const [showBudgetWarning, setShowBudgetWarning] = useState(false)

  // Function to recalculate discussion units from all votes
  const recalculateDiscussionUnits = () => {
    if (discussionState?.votes) {
      setIsRefreshing(true)

      // Calculate total discussion units from all votes across all policies
      const calculatedDiscussionUnits = {
        user: 0,
        agent1: 0,
        agent2: 0,
        agent3: 0,
        agent4: 0,
      }

      console.log("Recalculating DISCUSSION UNITS with votes:", discussionState.votes)

      // Process ALL votes from ALL policies to ensure cumulative units
      Object.entries(discussionState.votes).forEach(([policyIdStr, policyVotes]) => {
        const pId = Number(policyIdStr)
        const policy = policyQuestions.find((p) => p.id === pId)

        if (policy) {
          // Process each vote
          policyVotes.forEach((vote) => {
            const option = policy.options.find((o) => o.id === vote.optionId)
            if (option && vote.agentId) {
              calculatedDiscussionUnits[vote.agentId] = (calculatedDiscussionUnits[vote.agentId] || 0) + option.weight
              console.log(
                `Added ${option.weight} DISCUSSION UNITS for ${vote.agentId} from policy ${pId}, option ${vote.optionId}`,
              )
            }
          })
        }
      })

      console.log("RECALCULATED: Cumulative discussion units:", calculatedDiscussionUnits)

      // Update state and localStorage in one go
      setDiscussionUnits(calculatedDiscussionUnits)
      localStorage.setItem("beanDiscussionUnits", JSON.stringify(calculatedDiscussionUnits))

      setIsRefreshing(false)
      return calculatedDiscussionUnits
    }
    return null
  }

  // Replace the existing useEffect for discussion units with this more robust version
  useEffect(() => {
    console.log("Policy ID changed or votes updated, recalculating units...", policyId)

    // 1. Force immediate units recalculation when component mounts or policy changes
    recalculateDiscussionUnits()

    // 2. Set up an interval to check and update every 2 seconds (will be cleaned up on unmount)
    const intervalId = setInterval(() => {
      console.log("Interval units recalculation for policy", policyId)
      recalculateDiscussionUnits()
    }, 2000)

    // 3. Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [discussionState?.votes, policyId])

  // Get the current policy from policyQuestions
  const currentPolicy = policyQuestions.find((p) => p.id === policyId)

  // Calculate remaining budget for each agent
  const getRemainingBudget = (agentId: string) => {
    const budget = budgetUsage[agentId] || 0
    return 14 - budget
  }

  // Calculate remaining discussion units for each agent
  const getRemainingUnits = (agentId: string) => {
    const units = discussionUnits[agentId] || 0
    return 14 - units
  }

  // Check if an agent can afford a policy option
  const canAffordOption = (agentId: string, optionWeight: number) => {
    return getRemainingBudget(agentId) >= optionWeight
  }

  // Check if a policy has already been voted on
  const isPolicyVoted = (policyId: number) => {
    if (!discussionState) return false

    return discussionState.finalSelections && discussionState.finalSelections[policyId] !== undefined
  }

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis

      // Force load voices
      speechSynthRef.current.getVoices()

      // Initialize audio context to enable audio
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const audioCtx = new AudioContext()
          // Create and play a silent sound to unlock audio
          const oscillator = audioCtx.createOscillator()
          oscillator.frequency.value = 0
          oscillator.connect(audioCtx.destination)
          oscillator.start()
          oscillator.stop(audioCtx.currentTime + 0.001)
          audioInitializedRef.current = true
        }
      } catch (e) {
        console.error("Failed to initialize audio context:", e)
      }
    }

    return () => {
      if (speechSynthRef.current && speechSynthRef.current.speaking) {
        speechSynthRef.current.cancel()
      }
    }
  }, [])

  // Load budget usage from localStorage - FIXED to prevent incorrect budget updates
  useEffect(() => {
    if (budgetInitializedRef.current) return // Skip if already initialized

    const savedBudgetUsage = localStorage.getItem("beanPolicyBudgetUsage")
    if (savedBudgetUsage) {
      try {
        const parsedBudget = JSON.parse(savedBudgetUsage)
        setBudgetUsage(parsedBudget)
        budgetInitializedRef.current = true
      } catch (error) {
        console.error("Error parsing saved budget usage:", error)
      }
    } else {
      // If no budget exists yet, initialize with zeros
      setBudgetUsage({
        user: 0,
        agent1: 0,
        agent2: 0,
        agent3: 0,
        agent4: 0,
      })
      budgetInitializedRef.current = true
    }
  }, [])

  // Check for already voted policies and update budget accordingly - FIXED to prevent incorrect budget updates
  useEffect(() => {
    // Skip this effect if the current policy has not been voted on
    if (!currentPolicy || !isPolicyVoted(policyId)) {
      return
    }

    // Only update budget for policies that have been voted on
    if (discussionState && discussionState.votes && discussionState.votes[policyId]) {
      const votes = discussionState.votes[policyId] || []

      // Only update if we haven't already processed this policy's votes
      if (!budgetInitializedRef.current) {
        // Create a new budget object based on votes
        const newBudgetUsage = { ...budgetUsage }

        votes.forEach((vote: any) => {
          const option = currentPolicy.options.find((o) => o.id === vote.optionId)
          if (option) {
            newBudgetUsage[vote.agentId] = (newBudgetUsage[vote.agentId] || 0) + option.weight
          }
        })

        setBudgetUsage(newBudgetUsage)
        budgetInitializedRef.current = true
      }
    }
  }, [currentPolicy, policyId, discussionState])

  // Save budget usage to localStorage when it changes
  useEffect(() => {
    if (Object.values(budgetUsage).some((value) => value > 0)) {
      localStorage.setItem("beanPolicyBudgetUsage", JSON.stringify(budgetUsage))
    }
  }, [budgetUsage])

  // Add this function after the other useEffect hooks
  useEffect(() => {
    // Check if this is a new game session
    const isNewGame = sessionStorage.getItem("beanGameStarted") !== "true"

    if (isNewGame) {
      // Reset budget usage
      setBudgetUsage({
        user: 0,
        agent1: 0,
        agent2: 0,
        agent3: 0,
        agent4: 0,
      })

      // Clear budget from localStorage
      localStorage.removeItem("beanPolicyBudgetUsage")

      // Mark game as started
      sessionStorage.setItem("beanGameStarted", "true")
      budgetInitializedRef.current = true
    }
  }, [])

  // Add this useEffect right after the other useEffects
  useEffect(() => {
    // Force immediate budget recalculation on component mount
    if (discussionState?.votes) {
      console.log("Recalculating units on mount for policy", policyId)
      console.log("Current votes:", discussionState.votes)

      // Calculate total discussion units from all votes across all policies
      const calculatedUnits = {
        user: 0,
        agent1: 0,
        agent2: 0,
        agent3: 0,
        agent4: 0,
      }

      // Process ALL votes from ALL policies to ensure cumulative units
      Object.entries(discussionState.votes).forEach(([policyIdStr, policyVotes]) => {
        const pId = Number(policyIdStr)
        const policy = policyQuestions.find((p) => p.id === pId)

        if (policy) {
          policyVotes.forEach((vote) => {
            const option = policy.options.find((o) => o.id === vote.optionId)
            if (option) {
              calculatedUnits[vote.agentId] = (calculatedUnits[vote.agentId] || 0) + option.weight
            }
          })
        }
      })

      console.log("Calculated units on mount:", calculatedUnits)
      setDiscussionUnits(calculatedUnits)
      localStorage.setItem("beanDiscussionUnits", JSON.stringify(calculatedUnits))
    }
  }, [])

  // Add this useEffect to ensure units are loaded on mount and when policy changes
  useEffect(() => {
    console.log("Loading discussion units on mount for policy", policyId)

    // Try to load from localStorage first
    try {
      const savedDiscussionUnits = localStorage.getItem("beanDiscussionUnits")
      if (savedDiscussionUnits) {
        const parsedUnits = JSON.parse(savedDiscussionUnits)
        setDiscussionUnits(parsedUnits)
        console.log("Loaded discussion units from localStorage:", parsedUnits)
      }
    } catch (error) {
      console.error("Error loading discussion units:", error)
    }

    // Then force a recalculation to ensure it's up to date
    setTimeout(() => {
      recalculateDiscussionUnits()
    }, 100)
  }, [policyId])

  // Function to speak text
  const speakText = (text: string, agentId?: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioEnabled || !speechSynthRef.current) {
        resolve()
        return
      }

      try {
        // Cancel any ongoing speech
        if (speechSynthRef.current.speaking) {
          speechSynthRef.current.cancel()
        }

        // Create and configure the utterance
        const utterance = new SpeechSynthesisUtterance(text)

        // Force voice loading if needed
        if (speechSynthRef.current.getVoices().length === 0) {
          // Resolve immediately but try to load voices for next time
          speechSynthRef.current.onvoiceschanged = () => {
            // Voices loaded, but we've already moved on
          }
          resolve()
          return
        }

        // Get available voices
        const voices = speechSynthRef.current.getVoices()

        // Just use default voice to avoid issues
        // Store the current utterance
        currentUtteranceRef.current = utterance

        // Add event listeners with better error handling
        utterance.onend = () => {
          isSpeakingRef.current = false
          resolve()
        }

        utterance.onerror = () => {
          // Just log that an error occurred but don't show details
          console.log("Speech synthesis error occurred - continuing with message display")
          isSpeakingRef.current = false
          resolve()
        }

        // Speak the text
        isSpeakingRef.current = true
        speechSynthRef.current.speak(utterance)

        // Safety timeout in case the speech synthesis doesn't trigger onend
        setTimeout(() => {
          if (isSpeakingRef.current) {
            isSpeakingRef.current = false
            resolve()
          }
        }, 5000) // Fixed timeout of 5 seconds
      } catch (error) {
        console.log("Speech synthesis error caught - continuing with message display")
        resolve()
      }
    })
  }

  // Load previous messages from session storage or initialize with agent opinions
  useEffect(() => {
    if (currentPolicy) {
      const storedMessages = sessionStorage.getItem(`discussion-${currentPolicy.id}`)

      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages)
          setMessages(parsedMessages)

          // Check if initial opinions were already loaded
          const hasAgentMessages = parsedMessages.some((m: Message) => m.role === "agent")
          setInitialOpinionsLoaded(hasAgentMessages)
        } catch (error) {
          console.error("Error parsing stored messages:", error)
          initializeDiscussion()
        }
      } else {
        initializeDiscussion()
      }
    }
  }, [currentPolicy, policyId]) // Add policyId as a dependency to ensure it reinitializes when the ID changes

  // Find the initializeDiscussion function and update it to ensure API calls are made

  const initializeDiscussion = async () => {
    if (!currentPolicy) return

    // Add initial moderator message
    const initialMessage = {
      id: "initial",
      role: "moderator" as const,
      content: `Welcome to the discussion on "${currentPolicy.title}". The agents will now share their opinions.`,
      timestamp: new Date(),
    }

    // Add budget information message
    const budgetMessage = {
      id: "budget-info",
      role: "moderator" as const,
      content: `Remember: Each agent and you have a maximum budget of 14 units to allocate across all policies. Choose wisely!`,
      timestamp: new Date(),
    }

    setMessages([initialMessage, budgetMessage])
    setIsLoading(true)

    // Get opinions from all agents
    const agentMessages = []

    // Add a small delay between agent responses to make it feel more natural
    for (const agent of agents) {
      try {
        console.log(`Fetching opinion for agent ${agent.id} on policy ${policyId}...`)

        // Force a unique request by adding a timestamp to avoid caching
        const timestamp = Date.now()
        const response = await getAgentResponse(agent.id, policyId, timestamp)

        console.log(`Received response for agent ${agent.id}:`, response)

        const agentMessage = {
          id: `agent-${agent.id}-initial-${timestamp}`,
          role: "agent" as const,
          content: response,
          agentId: agent.id,
          timestamp: new Date(),
        }

        agentMessages.push(agentMessage)

        // Add a small delay between agent responses
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`Error getting opinion from agent ${agent.id}:`, error)

        // Add a fallback message if the API call fails
        const fallbackMessage = {
          id: `agent-${agent.id}-initial-fallback`,
          role: "agent" as const,
          content: getFallbackResponse(agent.id, policyId),
          agentId: agent.id,
          timestamp: new Date(),
        }

        agentMessages.push(fallbackMessage)
      }
    }

    // Add all messages to the queue
    setMessages((prev) => [...prev, ...agentMessages])
    setInitialOpinionsLoaded(true)
    setIsLoading(false)
  }

  // Save messages to session storage when they change
  useEffect(() => {
    if (currentPolicy && messages.length > 0) {
      sessionStorage.setItem(`discussion-${currentPolicy.id}`, JSON.stringify(messages))
    }
  }, [messages, currentPolicy])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages, currentTypingMessage])

  // Queue new agent messages for speaking
  useEffect(() => {
    // Process messages one by one with typing effect
    const processMessages = async () => {
      if (messages.length === 0 || isTyping) return

      // Find messages that aren't in visibleMessages yet
      const pendingMessages = messages.filter((msg) => !visibleMessages.some((vm) => vm.id === msg.id))

      if (pendingMessages.length === 0) return

      // Get the next message to process
      const nextMessage = pendingMessages[0]

      // Skip typing effect for moderator and user messages
      if (nextMessage.role === "moderator" || nextMessage.role === "user") {
        setVisibleMessages((prev) => [...prev, nextMessage])
        return
      }

      // For agent messages, show typing effect and play audio
      setIsTyping(true)
      setCurrentTypingMessage(nextMessage)
      setTypedText("")

      // Simulate typing effect - moderate typing (1 character at a time)
      const text = nextMessage.content
      const chunkSize = 1 // Process 1 character at a time for more natural typing

      // Start audio for agent messages at the beginning of typing
      let audioPromise = Promise.resolve()
      if (nextMessage.role === "agent" && audioEnabled) {
        audioPromise = speakText(nextMessage.content, nextMessage.agentId)
      }

      // Type out the message character by character
      for (let i = 0; i <= text.length; i += chunkSize) {
        await new Promise((resolve) => setTimeout(resolve, typingSpeed))
        setTypedText(text.substring(0, i))
      }
      setTypedText(text) // Ensure full text is set

      // Wait for audio to finish (with a timeout)
      try {
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 3000))
        await Promise.race([audioPromise, timeoutPromise])
      } catch (e) {
        // Ignore errors
      }

      // Add a small delay after speech ends before showing next message
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Add message to visible messages
      setVisibleMessages((prev) => [...prev, nextMessage])
      setCurrentTypingMessage(null)
      setIsTyping(false)
    }

    processMessages()
  }, [messages, visibleMessages, isTyping, audioEnabled, agents, typingSpeed])

  // Toggle audio
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)

    // If turning audio off while speaking, cancel current speech
    if (audioEnabled && speechSynthRef.current && speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel()
      isSpeakingRef.current = false
    }

    // If turning audio on, try to initialize it
    if (!audioEnabled && !audioInitializedRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          const audioCtx = new AudioContext()
          const oscillator = audioCtx.createOscillator()
          oscillator.frequency.value = 0
          oscillator.connect(audioCtx.destination)
          oscillator.start()
          oscillator.stop(audioCtx.currentTime + 0.001)
          audioInitializedRef.current = true
        }
      } catch (e) {
        console.error("Failed to initialize audio context:", e)
      }
    }
  }

  // Handle agent selection
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId)
  }

  // Handle user message submission
  const handleUserMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // If a specific agent is selected, get response from that agent only
    if (selectedAgentId && currentPolicy) {
      const selectedAgent = agents.find((a) => a.id === selectedAgentId)
      if (selectedAgent) {
        try {
          // Get conversation history for context
          const conversationHistory = messages
            .filter((m) => m.role !== "moderator")
            .map((m) => {
              if (m.role === "user") {
                return `User: ${m.content}`
              } else {
                const agentInfo = agents.find((a) => a.id === m.agentId)
                return `${agentInfo?.name || "Agent"}: ${m.content}`
              }
            })
            .join("\n")

          const response = await getAgentResponseToUser(selectedAgentId, message, policyId, conversationHistory)

          const agentMessage = {
            id: `agent-${Date.now()}`,
            role: "agent" as const,
            content: response,
            agentId: selectedAgent.id,
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, agentMessage])
        } catch (error) {
          console.error("Error getting agent response:", error)
        }
      }
    } else {
      // Get responses from all agents
      for (const agent of agents) {
        if (currentPolicy) {
          try {
            // Get conversation history for context
            const conversationHistory = messages
              .filter((m) => m.role !== "moderator")
              .map((m) => {
                if (m.role === "user") {
                  return `User: ${m.content}`
                } else {
                  const agentInfo = agents.find((a) => a.id === m.agentId)
                  return `${agentInfo?.name || "Agent"}: ${m.content}`
                }
              })
              .join("\n")

            const response = await getAgentResponseToUser(agent.id, message, policyId, conversationHistory)

            const agentMessage = {
              id: `agent-${agent.id}-${Date.now()}`,
              role: "agent" as const,
              content: response,
              agentId: agent.id,
              timestamp: new Date(),
            }

            setMessages((prev) => [...prev, agentMessage])

            // Add a small delay between agent responses
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (error) {
            console.error("Error getting agent response:", error)
          }
        }
      }
    }

    setIsLoading(false)
  }

  // Handle vote button click - Ensure budget is updated before navigation
  const handleVoteClick = () => {
    if (currentPolicy) {
      // Force a recalculation of the discussion units based on ALL votes
      recalculateDiscussionUnits()

      // Add a small delay to ensure state is updated before navigation
      setTimeout(() => {
        router.push(`/voting/${currentPolicy.id}`)
      }, 200)
    }
  }

  // Add this useEffect to ensure budget is updated when navigating between pages
  useEffect(() => {
    // Force budget recalculation on every page load
    recalculateDiscussionUnits()

    // Also try to load from localStorage as a fallback
    try {
      const savedDiscussionUnits = localStorage.getItem("beanDiscussionUnits")
      if (savedDiscussionUnits) {
        const parsedUnits = JSON.parse(savedDiscussionUnits)
        setDiscussionUnits(parsedUnits)
      }
    } catch (error) {
      console.error("Error loading discussion units:", error)
    }
  }, [policyId])

  if (!currentPolicy) {
    return (
      <div className="min-h-screen bright-background py-8 px-4 flex items-center justify-center">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="bright-pattern"></div>
        <Card className="shadow-lg overflow-hidden glow-card dark-card max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 neon-text">Policy Not Found</h2>
            <p className="text-gray-100 mb-4">The policy you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/policy/1")} className="neon-button">
              Return to Policies
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ensure we have valid numeric values for calculations
  const safeRemainingQuestions = 7 - policyId + 1
  const safeUserBudget = budgetUsage.user || 0
  const safeUserRemainingBudget = 14 - safeUserBudget

  return (
    <div className="min-h-screen bright-background py-8 px-4">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <div className="bright-pattern"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 neon-text">Parliamentary Discussion</h1>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 neon-text-secondary">{currentPolicy.title}</h2>
            <p className="text-gray-100">{currentPolicy.description}</p>

            {/* Display policy options */}
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-medium neon-text">Policy Options:</h3>
              {currentPolicy.options.map((option) => (
                <div key={option.id} className={`p-3 border border-primary/20 rounded-lg bg-primary/5`}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-100">Option {option.id}</h4>
                    <span className="px-2 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs">
                      {option.weight} unit{option.weight !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{option.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="neon-button-secondary"
              disabled={true} // Disable back button to prevent going back
            >
              <Lock className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAudio}
                className={audioEnabled ? "neon-button" : "neon-button-secondary"}
                title={audioEnabled ? "Mute audio" : "Enable audio"}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>

              <Button onClick={handleVoteClick} className="neon-button">
                Vote Now
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AgentSelector
            onAgentSelect={handleAgentSelect}
            onUserMessage={handleUserMessage}
            selectedAgentId={selectedAgentId}
          />

          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 neon-text">Discussion</h3>

                <div className="chat-messages max-h-[400px] overflow-y-auto mb-4 space-y-4 pr-2">
                  {visibleMessages.map((message) => {
                    if (message.role === "moderator") {
                      return (
                        <div key={message.id} className="bg-secondary/20 p-3 rounded-lg text-center text-gray-100">
                          {message.content}
                        </div>
                      )
                    }

                    const agent = message.agentId ? agents.find((a) => a.id === message.agentId) : null

                    return (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-primary/20 border-r-2 border-primary/50"
                              : "bg-secondary/20 border-l-2 border-secondary/50"
                          }`}
                        >
                          {message.role === "agent" && agent && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white neon-text-secondary text-lg">
                                {agent.name.split(" - ")[0]}
                              </span>
                            </div>
                          )}
                          <p className="text-gray-100">{message.content}</p>
                        </div>
                      </div>
                    )
                  })}

                  {/* Show currently typing message */}
                  {currentTypingMessage && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] p-3 rounded-lg bg-secondary/20 border-l-2 border-secondary/50">
                        {currentTypingMessage.role === "agent" && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white neon-text-secondary text-lg">
                              {agents.find((a) => a.id === currentTypingMessage.agentId)?.name.split(" - ")[0]}
                            </span>
                          </div>
                        )}
                        <p className="text-gray-100">{typedText}</p>
                      </div>
                    </div>
                  )}

                  {isLoading && !currentTypingMessage && (
                    <div className="flex justify-start">
                      <div className="bg-secondary/20 p-3 rounded-lg border-l-2 border-secondary/50">
                        <div className="typing-indicator">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* User input area - always visible */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (inputValue.trim()) {
                    handleUserMessage(inputValue)
                    setInputValue("")
                  }
                }}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 p-3 border rounded-md min-h-[80px] resize-none bg-primary/10 border-primary/30 text-gray-100"
                  />
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className="neon-button-secondary"
                    onClick={() => {
                      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
                        const recognition = new SpeechRecognition()
                        recognition.lang = "en-US"
                        recognition.onresult = (event) => {
                          const transcript = event.results[0][0].transcript
                          setInputValue((prev) => prev + " " + transcript)
                        }
                        recognition.start()
                      } else {
                        alert("Speech recognition is not supported in your browser.")
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-mic"
                    >
                      <path d="M12 13v-2"></path>
                      <circle cx="12" cy="17" r="4"></circle>
                      <path d="M5 9c0-4 9-4 9 0"></path>
                      <path d="M15 9c0-2.206-1.794-4-4-4s-4 1.794-4 4"></path>
                    </svg>
                    Speak
                  </Button>
                  <Button type="submit" className="neon-button" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send
                        <Send className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
