"use client"

import React from "react"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import allAgentProfiles, { type AgentProfile } from "@/data/all-agent-profiles"
import { policyQuestions } from "@/data/policy-questions"
import { getAgentPreferredOption } from "@/lib/openai-service"

type AgentVote = {
  agentId: string
  policyId: number
  optionId: number
}

type DiscussionState = {
  votes: Record<number, AgentVote[]>
  finalSelections: Record<number, number>
}

interface AgentContextType {
  agents: AgentProfile[]
  selectedAgent: AgentProfile | null
  discussionState: DiscussionState
  initialAgentVotes: Record<string, Record<number, number>>
  agentPreferredOptions: Record<string, Record<number, number>>
  setSelectedAgent: (agent: AgentProfile | null) => void
  userVote: (policyId: number, optionId: number) => void
  agentVotes: (policyId: number) => void
  getFinalSelection: (policyId: number) => number | null
  generateInitialAgentVotes: () => void
  getAgentPreferredOptions: (policyId: number) => Promise<Record<string, number> | undefined>
  hasInitialVotes: boolean
  resetGameState: () => void
}

const initialDiscussionState: DiscussionState = {
  votes: {},
  finalSelections: {},
}

const AgentContext = createContext<AgentContextType>({
  agents: [],
  selectedAgent: null,
  discussionState: initialDiscussionState,
  initialAgentVotes: {},
  agentPreferredOptions: {},
  setSelectedAgent: () => {},
  userVote: () => {},
  agentVotes: () => {},
  getFinalSelection: () => null,
  generateInitialAgentVotes: () => {},
  getAgentPreferredOptions: () => Promise.resolve(undefined),
  hasInitialVotes: false,
  resetGameState: () => {},
})

// Helper function to calculate total budget used by an agent's votes
function calculateBudgetUsed(votes: Record<number, number>): number {
  let total = 0
  Object.entries(votes).forEach(([policyId, optionId]) => {
    const policy = policyQuestions.find((p) => p.id === Number(policyId))
    if (policy) {
      const option = policy.options.find((o) => o.id === optionId)
      if (option) {
        total += option.weight
      }
    }
  })
  return total
}

// Helper function to randomly select 4 agents from the pool
function selectRandomAgents(): AgentProfile[] {
  // Shuffle the array using Fisher-Yates algorithm
  const shuffled = [...allAgentProfiles]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Take the first 4 agents
  return shuffled.slice(0, 4)
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null)
  const [discussionState, setDiscussionState] = useState<DiscussionState>(initialDiscussionState)
  const [initialAgentVotes, setInitialAgentVotes] = useState<Record<string, Record<number, number>>>({})
  const [agentPreferredOptions, setAgentPreferredOptions] = useState<Record<string, Record<number, number>>>({})
  const [hasInitialVotes, setHasInitialVotes] = useState(false)

  useEffect(() => {
    // Check if this is a new game session
    const isNewGame = sessionStorage.getItem("beanGameStarted") !== "true"

    if (isNewGame) {
      // Select random agents for a new game
      const randomAgents = selectRandomAgents()
      setAgents(randomAgents)

      // Save the selected agents to session storage
      sessionStorage.setItem("beanSelectedAgents", JSON.stringify(randomAgents))

      // Mark game as started
      sessionStorage.setItem("beanGameStarted", "true")

      // Clear any existing initial votes and budget usage for a new game
      localStorage.removeItem("beanInitialAgentVotes")
      localStorage.removeItem("beanBudgetUsage")
      localStorage.removeItem("beanDiscussionState")
      setInitialAgentVotes({})
      setHasInitialVotes(false)
    } else {
      // Try to load previously selected agents
      const savedAgents = sessionStorage.getItem("beanSelectedAgents")
      if (savedAgents) {
        try {
          const parsedAgents = JSON.parse(savedAgents)
          setAgents(parsedAgents)
        } catch (error) {
          console.error("Error parsing saved agents:", error)
          // For consistency, don't select new random agents if there's an error
          // Instead, use a fixed set of the first 4 agents
          setAgents(allAgentProfiles.slice(0, 4))
          // Save these agents to session storage
          sessionStorage.setItem("beanSelectedAgents", JSON.stringify(allAgentProfiles.slice(0, 4)))
        }
      } else {
        // If no saved agents but game has started, use a fixed set of the first 4 agents
        // This ensures consistency even if sessionStorage gets cleared
        setAgents(allAgentProfiles.slice(0, 4))
        // Save these agents to session storage
        sessionStorage.setItem("beanSelectedAgents", JSON.stringify(allAgentProfiles.slice(0, 4)))
      }
    }

    // Try to load discussion state from localStorage
    const savedState = localStorage.getItem("beanDiscussionState")
    if (savedState) {
      try {
        setDiscussionState(JSON.parse(savedState))
      } catch (error) {
        console.error("Error parsing saved discussion state:", error)
      }
    }

    // Try to load initial agent votes from localStorage
    const savedInitialVotes = localStorage.getItem("beanInitialAgentVotes")
    if (savedInitialVotes) {
      try {
        const parsedVotes = JSON.parse(savedInitialVotes)
        setInitialAgentVotes(parsedVotes)
        setHasInitialVotes(Object.keys(parsedVotes).length > 0)
      } catch (error) {
        console.error("Error parsing saved initial agent votes:", error)
      }
    }
  }, [])

  // Save discussion state to localStorage when it changes
  useEffect(() => {
    if (Object.keys(discussionState.votes).length > 0 || Object.keys(discussionState.finalSelections).length > 0) {
      localStorage.setItem("beanDiscussionState", JSON.stringify(discussionState))
    }
  }, [discussionState])

  // Save initial agent votes to localStorage when they change
  useEffect(() => {
    if (Object.keys(initialAgentVotes).length > 0) {
      localStorage.setItem("beanInitialAgentVotes", JSON.stringify(initialAgentVotes))
    }
  }, [initialAgentVotes])

  // Generate initial votes for all agents (to be done in the background)
  const generateInitialAgentVotes = useCallback(() => {
    // Skip if we already have initial votes
    if (hasInitialVotes || Object.keys(initialAgentVotes).length > 0) {
      return
    }

    // Skip if we don't have agents loaded yet
    if (agents.length === 0) {
      return
    }

    // Initialize budget usage
    const budgetUsage: Record<string, number> = {}

    // Initialize votes for each agent
    const newInitialVotes: Record<string, Record<number, number>> = {}

    agents.forEach((agent) => {
      const agentVotes: Record<number, number> = {}
      let agentBudget = 0

      // For each policy question
      policyQuestions.forEach((question) => {
        // Calculate remaining budget
        const remainingBudget = 14 - agentBudget

        // Calculate remaining policies after this one
        const remainingPolicies = policyQuestions.length - question.id + 1

        // Add some randomness to agent preferences (25% chance to deviate from default preference)
        const randomFactor = Math.random() < 0.25

        // Default to option 1 (cheapest)
        let preferredOption = 1

        // Determine preferred option based on agent's specialty and perspective
        if (agent.specialty?.includes("Trauma") || agent.perspective.includes("trauma")) {
          // Agents focused on trauma prefer comprehensive support (Option 3) for psychological support
          if (question.id === 5) {
            // Psychological Support policy
            preferredOption = 3
          } else {
            preferredOption = 2
          }
        } else if (
          agent.specialty?.includes("Cultural") ||
          agent.perspective.includes("cultural") ||
          agent.specialty?.includes("Mother Tongue") ||
          agent.perspective.includes("mother tongue")
        ) {
          // Agents focused on cultural preservation prefer mother tongue education (Option 2 for language)
          if (question.id === 1) {
            // Language of Instruction policy
            preferredOption = 2
          } else {
            preferredOption = 1
          }
        } else if (
          agent.specialty?.includes("Inclusion") ||
          agent.perspective.includes("inclusion") ||
          agent.specialty?.includes("Equal") ||
          agent.perspective.includes("equal")
        ) {
          // Agents focused on inclusion prefer more comprehensive options
          preferredOption = 3
        } else if (
          agent.specialty?.includes("Evidence") ||
          agent.perspective.includes("evidence") ||
          agent.specialty?.includes("Data") ||
          agent.perspective.includes("data")
        ) {
          // Evidence-based agents prefer balanced approaches
          preferredOption = 2
        } else {
          // Default to middle option for other agents
          preferredOption = 2
        }

        // Add randomness
        if (randomFactor) {
          if (preferredOption === 1) preferredOption = Math.random() < 0.5 ? 2 : 1
          else if (preferredOption === 2) preferredOption = Math.random() < 0.5 ? 1 : 3
          else preferredOption = Math.random() < 0.5 ? 2 : 3
        }

        // Budget constraints check
        const option3Weight = question.options.find((o) => o.id === 3)?.weight || 0
        const option2Weight = question.options.find((o) => o.id === 2)?.weight || 0
        const option1Weight = question.options.find((o) => o.id === 1)?.weight || 0

        // If remaining budget is exactly equal to remaining policies, force option 1 for all
        if (remainingBudget <= remainingPolicies) {
          preferredOption = 1
        }
        // Adjust based on budget constraints
        else if (preferredOption === 3 && remainingBudget < option3Weight) {
          preferredOption = 2 // Downgrade to option 2 if can't afford option 3
        }

        if (preferredOption === 2 && remainingBudget < option2Weight) {
          preferredOption = 1 // Downgrade to option 1 if can't afford option 2
        }

        // Get the weight of the selected option
        const selectedOptionWeight = question.options.find((o) => o.id === preferredOption)?.weight || 0

        // Update agent's budget
        agentBudget += selectedOptionWeight

        // Store the vote
        agentVotes[question.id] = preferredOption
      })

      // Store this agent's votes
      newInitialVotes[agent.id] = agentVotes

      // Update budget usage
      budgetUsage[agent.id] = agentBudget
    })

    // Save the initial votes
    setInitialAgentVotes(newInitialVotes)
    setHasInitialVotes(true)

    // Save updated budget usage
    localStorage.setItem("beanBudgetUsage", JSON.stringify(budgetUsage))
  }, [agents, initialAgentVotes, hasInitialVotes])

  // Get agent preferred options for a policy
  const getAgentPreferredOptions = useCallback(
    async (policyId: number) => {
      // Skip if we don't have agents loaded yet
      if (agents.length === 0) {
        return
      }

      const newPreferredOptions: Record<string, number> = {}

      // Get preferred option for each agent
      for (const agent of agents) {
        try {
          // If we already have a preferred option for this agent and policy, skip
          if (agentPreferredOptions[agent.id]?.[policyId]) {
            continue
          }

          // Get the preferred option from OpenAI
          const preferredOption = await getAgentPreferredOption(agent.id, policyId)

          // Store the preferred option
          setAgentPreferredOptions((prev) => ({
            ...prev,
            [agent.id]: {
              ...(prev[agent.id] || {}),
              [policyId]: preferredOption,
            },
          }))

          newPreferredOptions[agent.id] = preferredOption
        } catch (error) {
          console.error(`Error getting preferred option for agent ${agent.id}:`, error)
        }
      }

      return newPreferredOptions
    },
    [agents, agentPreferredOptions],
  )

  // Add this function to reset the game state completely
  const resetGameState = () => {
    // Clear all game-related storage
    localStorage.removeItem("beanBudgetUsage")
    localStorage.removeItem("beanDiscussionState")
    localStorage.removeItem("beanInitialAgentVotes")
    sessionStorage.removeItem("beanGameStarted")
    sessionStorage.removeItem("beanSelectedAgents")

    // Clear all policy discussions
    for (let i = 1; i <= 7; i++) {
      sessionStorage.removeItem(`discussion-${i}`)
    }

    // Reset state
    setInitialAgentVotes({})
    setHasInitialVotes(false)
    setDiscussionState(initialDiscussionState)

    // Select new random agents
    const randomAgents = selectRandomAgents()
    setAgents(randomAgents)

    // Save the selected agents to session storage
    sessionStorage.setItem("beanSelectedAgents", JSON.stringify(randomAgents))

    // Mark game as started
    sessionStorage.setItem("beanGameStarted", "true")
  }

  // Add a vote for the user
  const userVote = (policyId: number, optionId: number) => {
    setDiscussionState((prev) => {
      const currentVotes = prev.votes[policyId] || []
      // Remove any existing user vote
      const filteredVotes = currentVotes.filter((vote) => vote.agentId !== "user")
      // Add new user vote
      const newVotes = [...filteredVotes, { agentId: "user", policyId, optionId }]

      return {
        ...prev,
        votes: {
          ...prev.votes,
          [policyId]: newVotes,
        },
      }
    })
  }

  // Simulate agent voting based on their preferences
  const agentVotes = async (policyId: number) => {
    // Get preferred options for this policy if not already available
    const preferredOptions = await getAgentPreferredOptions(policyId)

    setDiscussionState((prev) => {
      const currentVotes = prev.votes[policyId] || []
      const filteredVotes = currentVotes.filter((vote) => vote.agentId === "user") // Keep user votes

      // Generate votes for each agent based on their preferred options
      const agentVotesList = agents.map((agent) => {
        // Get the preferred option for this agent
        const preferredOption = agentPreferredOptions[agent.id]?.[policyId] || preferredOptions?.[agent.id] || 2 // Default to middle option if not found

        return {
          agentId: agent.id,
          policyId,
          optionId: preferredOption,
        }
      })

      const allVotes = [...filteredVotes, ...agentVotesList]

      // Calculate the winning option
      const optionCounts = { 1: 0, 2: 0, 3: 0 }
      allVotes.forEach((vote) => {
        optionCounts[vote.optionId as keyof typeof optionCounts]++
      })

      // Find option with most votes
      let winningOption = 1
      let maxVotes = 0
      let tieExists = false
      let tieOptions: number[] = []

      Object.entries(optionCounts).forEach(([option, count]) => {
        if (count > maxVotes) {
          maxVotes = count
          winningOption = Number(option)
          tieExists = false
          tieOptions = [Number(option)]
        } else if (count === maxVotes && count > 0) {
          tieExists = true
          tieOptions.push(Number(option))
        }
      })

      // If there's a tie, randomly select one of the tied options
      if (tieExists) {
        const randomIndex = Math.floor(Math.random() * tieOptions.length)
        winningOption = tieOptions[randomIndex]
      }

      // Update budget usage in localStorage
      try {
        const policy = policyQuestions.find((p) => p.id === policyId)
        if (policy) {
          // Get current budget usage
          let currentBudgetUsage: Record<string, number> = {}
          const savedBudgetUsage = localStorage.getItem("beanBudgetUsage")
          if (savedBudgetUsage) {
            currentBudgetUsage = JSON.parse(savedBudgetUsage)
          }

          // Update budget for each agent's vote
          allVotes.forEach((vote) => {
            const optionWeight = policy.options.find((o) => o.id === vote.optionId)?.weight || 0
            currentBudgetUsage[vote.agentId] = (currentBudgetUsage[vote.agentId] || 0) + optionWeight
          })

          // Save updated budget usage
          localStorage.setItem("beanBudgetUsage", JSON.stringify(currentBudgetUsage))
        }
      } catch (error) {
        console.error("Error updating budget usage:", error)
      }

      return {
        ...prev,
        votes: {
          ...prev.votes,
          [policyId]: allVotes,
        },
        finalSelections: {
          ...prev.finalSelections,
          [policyId]: winningOption,
        },
      }
    })
  }

  // Get the final selection for a policy
  const getFinalSelection = (policyId: number): number | null => {
    return discussionState.finalSelections[policyId] || null
  }

  const contextValue = React.useMemo<AgentContextType>(
    () => ({
      agents,
      selectedAgent,
      discussionState,
      initialAgentVotes,
      agentPreferredOptions,
      setSelectedAgent,
      agentVotes,
      getFinalSelection,
      generateInitialAgentVotes,
      getAgentPreferredOptions,
      hasInitialVotes,
      resetGameState,
    }),
    [
      agents,
      selectedAgent,
      discussionState,
      initialAgentVotes,
      agentPreferredOptions,
      setSelectedAgent,
      userVote,
      agentVotes,
      getFinalSelection,
      generateInitialAgentVotes,
      getAgentPreferredOptions,
      hasInitialVotes,
      resetGameState,
    ],
  )

  return <AgentContext.Provider value={contextValue}>{children}</AgentContext.Provider>
}

export const useAgentContext = () => useContext(AgentContext)
export const useAgents = () => useContext(AgentContext)
