"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { usePolicyContext } from "@/providers/policy-provider"
import { useAgentContext } from "@/providers/agent-provider"
import { Check, Loader2, AlertCircle, ArrowRight, Lock } from "lucide-react"
import { policyQuestions } from "@/data/policy-questions"
import type { AgentProfile, PolicyOption } from "@/types"
import { getAgentPreferredOption } from "@/lib/openai-service"

export default function VotingPage() {
  // Add this function at the beginning of the component, before any other logic
  const resetBudgetIfFirstPolicy = () => {
    // Only reset if this is policy 1 (first question)
    if (policyId === 1) {
      console.log("First policy detected - resetting all budgets to 0")

      // Reset policy budget
      const resetBudget = {
        user: 0,
        agent1: 0,
        agent2: 0,
        agent3: 0,
        agent4: 0,
      }

      // Reset all budget-related storage
      localStorage.setItem("beanBudgetUsage", JSON.stringify(resetBudget))
      localStorage.setItem("beanPolicyBudgetUsage", JSON.stringify(resetBudget))
      localStorage.setItem("beanDiscussionBudgetUsage", JSON.stringify(resetBudget))
      localStorage.setItem("beanDiscussionUnits", JSON.stringify(resetBudget))

      // Update state
      setBudgetUsage(resetBudget)
      setDiscussionBudgetUsage(resetBudget)
    }
  }

  const router = useRouter()
  const { id } = useParams()
  const policyId = Number.parseInt(Array.isArray(id) ? id[0] : id)
  const { policies: policySelections, selectPolicy } = usePolicyContext()
  const { agents, discussionState: contextDiscussionState } = useAgentContext()
  const [selectedVote, setSelectedVote] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agentVotes, setAgentVotes] = useState<Record<string, number>>({})
  // Fix: Initialize showResults with false instead of referencing itself
  const [showResults, setShowResults] = useState(false)
  const [finalOption, setFinalOption] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [budgetUpdated, setBudgetUpdated] = useState(false) // Track if budget has been updated
  const [userVote, setUserVote] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [autoRedirect, setAutoRedirect] = useState(false) // Disabled by default - only redirect when user clicks next
  const [budgetInitialized, setBudgetInitialized] = useState(false) // Track if budget has been initialized
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tiebreakInfo, setTiebreakInfo] = useState<{
    occurred: boolean
    options: number[]
    winner: number | null
  }>({
    occurred: false,
    options: [],
    winner: null,
  })
  const [maxVotes, setMaxVotes] = useState<number>(0)
  const [totalVotes, setTotalVotes] = useState<number>(0)
  // Add a new state variable to track if votes have been finalized
  const [votesFinalized, setVotesFinalized] = useState(false)
  // Add a new state variable to track majority options across all policies
  const [majorityOptions, setMajorityOptions] = useState<
    Record<
      number,
      {
        optionId: number
        votes: number
        totalVotes: number
        policyTitle: string
        optionText: string
        weight: number
      }
    >
  >({})

  // Initialize discussionState from context or create a default empty state
  const [discussionState, setDiscussionState] = useState({
    votes: {},
    finalSelections: {},
  })

  // Add this useEffect to properly initialize discussionState from context
  useEffect(() => {
    if (contextDiscussionState) {
      setDiscussionState(contextDiscussionState)
    } else {
      // Try to load from localStorage as fallback
      try {
        const savedState = localStorage.getItem("beanDiscussionState")
        if (savedState) {
          setDiscussionState(JSON.parse(savedState))
        }
      } catch (error) {
        console.error("Error loading discussion state:", error)
      }
    }
  }, [contextDiscussionState])

  // Load majority options from localStorage on component mount
  useEffect(() => {
    try {
      const savedMajorityOptions = localStorage.getItem("beanMajorityOptions")
      if (savedMajorityOptions) {
        setMajorityOptions(JSON.parse(savedMajorityOptions))
      }
    } catch (error) {
      console.error("Error loading majority options:", error)
    }
  }, [])

  // Get the current policy from policyQuestions
  const currentPolicy = policyQuestions.find((p) => p.id === policyId)

  // Function to recalculate discussion units from all votes
  const recalculateDiscussionBudget = () => {
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

      // Process ALL votes from ALL policies to ensure cumulative units
      Object.entries(discussionState.votes).forEach(([policyIdStr, policyVotes]) => {
        // Process each vote
        const votes = policyVotes as any[]
        votes.forEach((vote) => {
          // Get the policy to find the option weight
          const policy = policyQuestions.find((p) => p.id === vote.policyId)
          if (policy) {
            const option = policy.options.find((o) => o.id === vote.optionId)
            if (option && vote.agentId) {
              calculatedDiscussionUnits[vote.agentId] = (calculatedDiscussionUnits[vote.agentId] || 0) + option.weight
            }
          }
        })
      })

      // Save the recalculated units to localStorage
      localStorage.setItem("beanDiscussionUnits", JSON.stringify(calculatedDiscussionUnits))

      // Update the state variable
      setDiscussionBudgetUsage(calculatedDiscussionUnits)

      setIsRefreshing(false)
      return calculatedDiscussionUnits
    }
    return null
  }

  // Add this function near the other utility functions (if it doesn't exist already)
  // Use the agent's actual preferred option without budget constraints
  function getAgentVote(agent: AgentProfile, options: PolicyOption[], policyId: number): number {
    // Try to get the agent's preferred option from localStorage
    try {
      const savedPreferredOptions = localStorage.getItem("beanAgentPreferredOptions")
      if (savedPreferredOptions) {
        const preferredOptions = JSON.parse(savedPreferredOptions)
        if (preferredOptions[agent.id]?.[policyId]) {
          // Convert from option ID (1-3) to array index (0-2)
          const optionId = preferredOptions[agent.id][policyId]
          const optionIndex = options.findIndex((opt) => opt.id === optionId)
          return optionIndex >= 0 ? optionIndex : 1 // Default to option 2 (index 1) if not found
        }
      }
    } catch (error) {
      console.error("Error getting agent preferred option:", error)
    }

    // If no preferred option is found, use a default distribution
    // This ensures equal probability for all options
    const rand = Math.random()
    if (rand < 0.33) {
      return 2 // Option 3 (33% chance)
    } else if (rand < 0.66) {
      return 1 // Option 2 (33% chance)
    } else {
      return 0 // Option 1 (33% chance)
    }
  }

  // Get messages from session storage and analyze agent opinions
  useEffect(() => {
    if (currentPolicy && !votesFinalized) {
      setIsAnalyzing(true)

      // Function to get agent preferred options
      const getAgentPreferredOptions = async () => {
        const votes: Record<string, number> = {}

        // Try to load preferred options from localStorage first
        let savedPreferredOptions: Record<string, Record<number, number>> = {}
        try {
          const savedData = localStorage.getItem("beanAgentPreferredOptions")
          if (savedData) {
            savedPreferredOptions = JSON.parse(savedData)
          }
        } catch (error) {
          console.error("Error loading preferred options:", error)
        }

        // For each agent, get their preferred option
        for (const agent of agents) {
          try {
            // Check if we already have a preferred option for this agent and policy
            if (savedPreferredOptions[agent.id]?.[policyId]) {
              votes[agent.id] = savedPreferredOptions[agent.id][policyId]
              continue
            }

            // If not, get it from OpenAI
            const preferredOption = await getAgentPreferredOption(agent.id, policyId)
            votes[agent.id] = preferredOption

            // Save to localStorage
            savedPreferredOptions[agent.id] = {
              ...(savedPreferredOptions[agent.id] || {}),
              [policyId]: preferredOption,
            }
          } catch (error) {
            console.error(`Error getting preferred option for agent ${agent.id}:`, error)
            // Use a default option if there's an error
            votes[agent.id] = 2 // Default to option 2
          }
        }

        // Save all preferred options to localStorage
        localStorage.setItem("beanAgentPreferredOptions", JSON.stringify(savedPreferredOptions))

        setAgentVotes(votes)
        setIsAnalyzing(false)
      }

      getAgentPreferredOptions()
    }
  }, [currentPolicy, policyId, agents, votesFinalized])

  // Function to adjust agent votes based on budget constraints
  const getAdjustedAgentVote = (
    agentId: string,
    policyId: number,
    preferredOption: number,
    budgetUsage: any,
  ): number => {
    // Get the current policy
    const policy = policyQuestions.find((p) => p.id === policyId)
    if (!policy) return 1 // Default to cheapest option if policy not found

    // Calculate remaining budget for this agent
    const agentBudget = budgetUsage[agentId] || 0
    const remainingBudget = 14 - agentBudget

    // Calculate remaining policies (including current one)
    const remainingPolicies = 7 - policyId + 1

    // Minimum budget needed for remaining policies (1 unit per policy)
    const minimumBudgetNeeded = remainingPolicies

    // If remaining budget is exactly equal to remaining policies, force option 1 for all
    if (remainingBudget <= minimumBudgetNeeded) {
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
    if (budgetAfterChoice >= remainingPoliciesAfterThis) {
      // Can afford this option and still have enough for remaining questions
      return preferredOption
    } else if (
      preferredOption === 3 &&
      budgetAfterChoice + (option3Weight - option2Weight) >= remainingPoliciesAfterThis
    ) {
      // Try option 2 instead
      return 2
    } else {
      // Must choose option 1 to ensure enough budget for remaining questions
      return 1
    }
  }

  const [discussionBudgetUsage, setDiscussionBudgetUsage] = useState({
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  })

  const [budgetUsage, setBudgetUsage] = useState({
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  })

  // Handle vote submission - Update to update both policy and discussion budgets
  // Update the handleVote function to ensure we're using the latest budget data
  // Replace the beginning of the handleVote function with this:
  const handleVote = (optionId: number) => {
    if (!currentPolicy) return

    // Get the selected option
    const selectedOption = currentPolicy.options.find((o) => o.id === optionId)
    if (!selectedOption) return

    // Set selected vote
    setSelectedVote(optionId)

    // Update user vote
    setUserVote({
      policyId: currentPolicy.id,
      optionId: selectedOption.id,
    })

    // Initialize fresh budget objects for this vote
    let currentPolicyBudget = { user: 0, agent1: 0, agent2: 0, agent3: 0, agent4: 0 }
    let currentDiscussionBudget = { user: 0, agent1: 0, agent2: 0, agent3: 0, agent4: 0 }

    // For policy 1, ensure we start with zero budgets
    if (policyId === 1) {
      console.log("First policy - using fresh budget")
    } else {
      // For other policies, try to load current budget usage
      try {
        const savedBudgetUsage = localStorage.getItem("beanBudgetUsage")
        if (savedBudgetUsage) {
          currentPolicyBudget = JSON.parse(savedBudgetUsage)
          console.log("Loaded existing policy budget:", currentPolicyBudget)
        }
      } catch (error) {
        console.error("Error parsing budget usage:", error)
      }

      // Load current discussion budget usage
      try {
        const savedDiscussionBudget = localStorage.getItem("beanDiscussionBudgetUsage")
        if (savedDiscussionBudget) {
          currentDiscussionBudget = JSON.parse(savedDiscussionBudget)
          console.log("Loaded existing discussion budget:", currentDiscussionBudget)
        }
      } catch (error) {
        console.error("Error parsing discussion budget usage:", error)
      }
    }

    // Update user policy budget
    currentPolicyBudget.user = (currentPolicyBudget.user || 0) + selectedOption.weight

    // Update user discussion budget - SEPARATE CALCULATION
    currentDiscussionBudget.user = (currentDiscussionBudget.user || 0) + selectedOption.weight

    // Save updated policy budget usage with clear naming
    localStorage.setItem("beanPolicyBudgetUsage", JSON.stringify(currentPolicyBudget))

    // Save updated discussion units with clear naming
    localStorage.setItem("beanDiscussionUnits", JSON.stringify(currentDiscussionBudget))

    // Update the state variables to reflect the changes
    setBudgetUsage(currentPolicyBudget)
    setDiscussionBudgetUsage(currentDiscussionBudget)

    // Generate agent votes with budget constraints
    const agentVotesList = agents.map((agent) => {
      // Get the options for the current policy
      const options = currentPolicy.options

      // Get the agent's vote using the function with policy ID
      const optionIndex = getAgentVote(agent, options, currentPolicy.id)
      let adjustedOption = options[optionIndex].id

      // Get the weight of the selected option
      const optionWeight = currentPolicy.options.find((o) => o.id === adjustedOption)?.weight || 0

      // Calculate current agent budget usage
      const currentAgentBudget = currentPolicyBudget[agent.id] || 0

      // Calculate TOTAL budget (14) minus USED budget
      const remainingBudget = 14 - currentAgentBudget

      // Calculate remaining questions AFTER this one (not including current)
      const remainingQuestionsAfterThis = 7 - policyId

      // Calculate how much budget would be left after this vote
      const budgetAfterVote = remainingBudget - optionWeight

      // Debug logging
      console.log(`Agent ${agent.id} for policy ${policyId}:`)
      console.log(`- Total budget: 14`)
      console.log(`- Used budget: ${currentAgentBudget}`)
      console.log(`- Remaining budget: ${remainingBudget}`)
      console.log(`- Option weight: ${optionWeight}`)
      console.log(`- Budget after vote: ${budgetAfterVote}`)
      console.log(`- Remaining questions: ${remainingQuestionsAfterThis}`)

      // Only override if the agent wouldn't have enough budget for remaining questions
      if (budgetAfterVote < remainingQuestionsAfterThis) {
        console.log(`- Budget constraint triggered: Overriding option ${adjustedOption} with option 1`)
        adjustedOption = 1 // Override with cheapest option
      } else {
        console.log(`- Using agent's preferred option: ${adjustedOption}`)
      }

      // Get the weight of the final adjusted option
      const finalOptionWeight = currentPolicy.options.find((o) => o.id === adjustedOption)?.weight || 0

      // Update agent policy budget
      currentPolicyBudget[agent.id] = (currentPolicyBudget[agent.id] || 0) + finalOptionWeight

      // Update agent discussion budget
      currentDiscussionBudget[agent.id] = (currentDiscussionBudget[agent.id] || 0) + finalOptionWeight

      return {
        agentId: agent.id,
        policyId: currentPolicy.id,
        optionId: adjustedOption,
      }
    })

    // Save updated policy budget usage
    localStorage.setItem("beanBudgetUsage", JSON.stringify(currentPolicyBudget))

    // Save updated discussion budget usage
    localStorage.setItem("beanDiscussionBudgetUsage", JSON.stringify(currentDiscussionBudget))

    // Immediately update the discussion budget state to reflect changes
    setDiscussionBudgetUsage(currentDiscussionBudget)

    setBudgetUpdated(true) // Mark that budget has been updated

    // Update agent votes state for display
    const newAgentVotes = {}
    agentVotesList.forEach((vote) => {
      newAgentVotes[vote.agentId] = vote.optionId
    })
    setAgentVotes(newAgentVotes)

    // Calculate the winning option
    const optionCounts = { 1: 0, 2: 0, 3: 0 }
    const allVotes = [
      {
        agentId: "user",
        policyId: currentPolicy.id,
        optionId: selectedOption.id,
      },
      ...agentVotesList,
    ]

    // Count votes properly
    allVotes.forEach((vote) => {
      if (vote.optionId >= 1 && vote.optionId <= 3) {
        optionCounts[vote.optionId as keyof typeof optionCounts]++
      }
    })

    // Log vote counts for debugging
    console.log("Vote counts:", optionCounts)

    // Find option with most votes
    let winningOption = 1
    let highestVoteCount = 0
    let tieExists = false
    let tieOptions: number[] = []

    Object.entries(optionCounts).forEach(([option, count]) => {
      if (count > highestVoteCount) {
        highestVoteCount = count
        winningOption = Number(option)
        tieExists = false
        tieOptions = [Number(option)]
      } else if (count === highestVoteCount && count > 0) {
        tieExists = true
        tieOptions.push(Number(option))
      }
    })

    // Set state variables for use in the JSX
    setMaxVotes(highestVoteCount)
    setTotalVotes(allVotes.length)

    // Log the winning option for debugging
    console.log("Winning option:", winningOption, "with", highestVoteCount, "votes")
    if (tieExists) {
      console.log("Tie detected between options:", tieOptions)
    }

    // If there's a tie, randomly select one of the tied options
    if (tieExists) {
      const randomIndex = Math.floor(Math.random() * tieOptions.length)
      winningOption = tieOptions[randomIndex]
      setTiebreakInfo({
        occurred: true,
        options: tieOptions,
        winner: winningOption,
      })
    } else {
      setTiebreakInfo({
        occurred: false,
        options: [],
        winner: null,
      })
    }

    // Set the final option
    setFinalOption(winningOption)

    // Update discussion state with all votes
    setDiscussionState((prev) => {
      return {
        ...prev,
        votes: {
          ...prev.votes,
          [currentPolicy.id]: allVotes,
        },
        finalSelections: {
          ...prev.finalSelections,
          [currentPolicy.id]: winningOption,
        },
      }
    })

    // Save to localStorage
    try {
      const updatedState = {
        ...discussionState,
        votes: {
          ...discussionState.votes,
          [currentPolicy.id]: allVotes,
        },
        finalSelections: {
          ...discussionState.finalSelections,
          [currentPolicy.id]: winningOption,
        },
      }
      localStorage.setItem("beanDiscussionState", JSON.stringify(updatedState))
    } catch (error) {
      console.error("Error saving discussion state:", error)
    }

    // NEW CODE: Store the majority option for this policy
    if (currentPolicy) {
      // Get the selected option details
      const selectedOptionDetails = currentPolicy.options.find((opt) => opt.id === winningOption)

      // Update the majority options state
      setMajorityOptions((prev) => {
        const updatedOptions = {
          ...prev,
          [currentPolicy.id]: {
            optionId: winningOption,
            votes: highestVoteCount,
            totalVotes: allVotes.length,
            policyTitle: currentPolicy.title,
            optionText: selectedOptionDetails?.text || "",
            weight: selectedOptionDetails?.weight || 0,
          },
        }

        // Save to localStorage
        localStorage.setItem("beanMajorityOptions", JSON.stringify(updatedOptions))

        return updatedOptions
      })
    }

    // Show results and success message
    setShowResults(true)
    setShowSuccess(true)
    // Add this line to mark votes as finalized
    setVotesFinalized(true)

    // Only set up auto-redirect if enabled
    if (autoRedirect) {
      // Navigate to next policy's discussion page after a delay (5 seconds)
      setTimeout(() => {
        if (currentPolicy.id < 7) {
          // Go to the next policy's discussion page
          router.push(`/discussion/${currentPolicy.id + 1}`)
        } else {
          // If this is the last policy, go to the summary results page
          router.push("/summary-results")
        }
      }, 5000) // 5 second delay
    }

    // Save agent policy budgets to localStorage
    // Object.keys(newAgentBudgets).forEach(agentId => {
    //   localStorage.setItem(`agent-${agentId}-policy-budget`, JSON.stringify(newAgentBudgets[agentId]));
    // });

    // Save user policy selection and budget
    // localStorage.setItem(`user-policy-${policyId}`, selectedOption.label);
    // localStorage.setItem(`user-policy-${policyId}-budget`, JSON.stringify(optionCost));
  }

  const handleContinue = () => {
    // Disable auto-redirect when manually continuing
    setAutoRedirect(false)

    if (currentPolicy) {
      // Find the next policy ID
      const currentIndex = policyQuestions.findIndex((p) => p.id === currentPolicy.id)

      if (currentIndex < policyQuestions.length - 1) {
        const nextPolicy = policyQuestions[currentIndex + 1]
        // Go to the next policy's discussion page
        router.push(`/discussion/${nextPolicy.id}`)
      } else {
        // If this is the last policy, go to the summary results page
        router.push("/summary-results")
      }
    }
  }

  // Function to get the color class for an option
  const getOptionColorClass = (optionId: number | null) => {
    if (!optionId) return ""

    switch (optionId) {
      case 1:
        return "text-green-500"
      case 2:
        return "text-blue-500"
      case 3:
        return "text-orange-500"
      default:
        return ""
    }
  }

  // Function to get the background color class for an option
  const getOptionBgClass = (optionId: number | null) => {
    if (!optionId) return ""

    switch (optionId) {
      case 1:
        return "bg-green-900/20 border-green-500/30"
      case 2:
        return "bg-blue-900/20 border-blue-500/30"
      case 3:
        return "bg-orange-900/20 border-orange-500/30"
      default:
        return ""
    }
  }

  // Calculate user's remaining budget
  const getUserRemainingBudget = () => {
    let budgetUsage = { user: 0 }
    try {
      const savedBudgetUsage = localStorage.getItem("beanBudgetUsage")
      if (savedBudgetUsage) {
        budgetUsage = JSON.parse(savedBudgetUsage)
      }
    } catch (error) {
      console.error("Error parsing budget usage:", error)
    }
    return 14 - (budgetUsage.user || 0)
  }

  // Calculate remaining policies after this one
  const remainingPolicies = policyQuestions.length - policyId

  // Calculate user's remaining budget
  const userRemainingBudget = getUserRemainingBudget()

  // Determine if an option should be disabled based on budget constraints
  const shouldDisableOption = (optionWeight: number): boolean => {
    // Get user's remaining policy budget
    let policyBudgetUsage = { user: 0 }
    let userRemainingPolicyBudget = 14

    try {
      const savedBudgetUsage = localStorage.getItem("beanPolicyBudgetUsage")
      if (savedBudgetUsage) {
        policyBudgetUsage = JSON.parse(savedBudgetUsage)
        userRemainingPolicyBudget = 14 - (policyBudgetUsage.user || 0)
      }
    } catch (error) {
      console.error("Error parsing policy budget usage:", error)
    }

    // Get user's remaining discussion units
    let discussionUnitsUsage = { user: 0 }
    let userRemainingDiscussionUnits = 14

    try {
      const savedDiscussionUnits = localStorage.getItem("beanDiscussionUnits")
      if (savedDiscussionUnits) {
        // Check if the value is a valid JSON string
        if (savedDiscussionUnits.startsWith("{") && savedDiscussionUnits.endsWith("}")) {
          discussionUnitsUsage = JSON.parse(savedDiscussionUnits)
          userRemainingDiscussionUnits = 14 - (discussionUnitsUsage.user || 0)
        } else {
          console.error("Invalid discussion units format:", savedDiscussionUnits)
          // Reset the discussion units in localStorage
          localStorage.setItem(
            "beanDiscussionUnits",
            JSON.stringify({ user: 0, agent1: 0, agent2: 0, agent3: 0, agent4: 0 }),
          )
        }
      }
    } catch (error) {
      console.error("Error parsing discussion units usage:", error)
      // Reset the discussion units in localStorage
      localStorage.setItem(
        "beanDiscussionUnits",
        JSON.stringify({ user: 0, agent1: 0, agent2: 0, agent3: 0, agent4: 0 }),
      )
    }

    // Use the more restrictive of the two budgets
    const effectiveRemainingBudget = Math.min(userRemainingPolicyBudget, userRemainingDiscussionUnits)

    // We need at least 1 point for each remaining policy
    const minimumNeededForRemaining = remainingPolicies

    // If selecting this option would leave less than the minimum needed, disable it
    return effectiveRemainingBudget - optionWeight < minimumNeededForRemaining
  }

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // Validate and initialize budget data
    try {
      // Check policy budget
      const savedBudgetUsage = localStorage.getItem("beanBudgetUsage")
      if (!savedBudgetUsage || !savedBudgetUsage.startsWith("{")) {
        // Initialize with default values
        localStorage.setItem(
          "beanBudgetUsage",
          JSON.stringify({
            user: 0,
            agent1: 0,
            agent2: 0,
            agent3: 0,
            agent4: 0,
          }),
        )
      }

      // Check discussion budget
      const savedDiscussionBudget = localStorage.getItem("beanDiscussionBudgetUsage")
      if (!savedDiscussionBudget || !savedDiscussionBudget.startsWith("{")) {
        // Initialize with default values
        localStorage.setItem(
          "beanDiscussionBudgetUsage",
          JSON.stringify({
            user: 0,
            agent1: 0,
            agent2: 0,
            agent3: 0,
            agent4: 0,
          }),
        )
      }
    } catch (error) {
      console.error("Error initializing budget data:", error)
      // Reset both budgets
      localStorage.setItem(
        "beanBudgetUsage",
        JSON.stringify({
          user: 0,
          agent1: 0,
          agent2: 0,
          agent3: 0,
          agent4: 0,
        }),
      )
      localStorage.setItem(
        "beanDiscussionBudgetUsage",
        JSON.stringify({
          user: 0,
          agent1: 0,
          agent2: 0,
          agent3: 0,
          agent4: 0,
        }),
      )
    }
  }, [])

  useEffect(() => {
    // Load discussion units from localStorage
    try {
      const savedDiscussionUnits = localStorage.getItem("beanDiscussionUnits")
      if (savedDiscussionUnits) {
        const parsedUnits = JSON.parse(savedDiscussionUnits)
        setDiscussionBudgetUsage(parsedUnits)
        console.log("Loaded discussion units in voting page:", parsedUnits)
      }
    } catch (error) {
      console.error("Error loading discussion units in voting page:", error)
    }
  }, [])

  useEffect(() => {
    // Load policy budget from localStorage
    try {
      const savedBudget = localStorage.getItem("beanPolicyBudgetUsage")
      if (savedBudget) {
        const parsedBudget = JSON.parse(savedBudget)
        setBudgetUsage(parsedBudget)
        console.log("Loaded policy budget in voting page:", parsedBudget)
      }
    } catch (error) {
      console.error("Error loading policy budget in voting page:", error)
    }
  }, [])

  // Add this useEffect to ensure discussion units are loaded correctly
  useEffect(() => {
    // Force a recalculation of discussion units on component mount
    const calculatedUnits = recalculateDiscussionBudget()

    // Also try to load from localStorage as a fallback
    if (!calculatedUnits) {
      try {
        const savedDiscussionUnits = localStorage.getItem("beanDiscussionUnits")
        if (savedDiscussionUnits) {
          const parsedUnits = JSON.parse(savedDiscussionUnits)
          setDiscussionBudgetUsage(parsedUnits)
          console.log("Loaded discussion units from localStorage:", parsedUnits)
        }
      } catch (error) {
        console.error("Error loading discussion units:", error)
      }
    }
  }, [])

  // Add this useEffect to call the reset function when the component mounts
  useEffect(() => {
    resetBudgetIfFirstPolicy()
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
          <h1 className="text-3xl font-bold mb-2 neon-text">Vote on Policy</h1>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 neon-text-secondary">{currentPolicy.title}</h2>
            <p className="text-gray-100">{currentPolicy.description}</p>

            {/* Display policy options */}
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-medium neon-text">Policy Options:</h3>
              {currentPolicy.options.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 border rounded-lg ${
                    showResults && finalOption === option.id
                      ? "border-green-500 bg-green-900/20"
                      : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-100">Option {option.id}</h4>
                    <span className="px-2 py-1 bg-primary/10 border border-primary/30 rounded-full text-xs">
                      {option.weight} unit{option.weight !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{option.text}</p>

                  {showResults && finalOption === option.id && (
                    <div className="mt-2 p-2 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        This option was selected by majority vote
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Discussion Units Tracker - Separate from policy budget */}
        <div className="mt-6 mb-6 p-4 bg-purple-900/10 border border-purple-500/30 rounded-lg">
          <h3 className="text-lg font-medium text-purple-300 mb-3">Discussion Units Tracker</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Discussion Units */}
            <div className="p-3 bg-purple-900/10 border border-purple-500/30 rounded-lg">
              <h4 className="text-white font-medium mb-2">Your Discussion Units</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Units Used:</span>
                <span className="font-bold text-purple-300">{discussionBudgetUsage.user || 0}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Units Remaining:</span>
                <span className="font-bold text-purple-300">{14 - (discussionBudgetUsage.user || 0)}</span>
              </div>
              <div className="w-full bg-gray-700/50 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
                  style={{ width: `${((discussionBudgetUsage.user || 0) / 14) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-1 text-right">Max 14 units for all discussions</div>
            </div>

            {/* Agents Discussion Units */}
            <div className="p-3 bg-purple-900/10 border border-purple-500/30 rounded-lg">
              <h4 className="text-white font-medium mb-2">Agents Discussion Units</h4>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm truncate max-w-[150px]">{agent.name.split(" - ")[0]}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{discussionBudgetUsage[agent.id] || 0}</span>
                      <div className="w-16 bg-gray-700/50 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-300"
                          style={{ width: `${((discussionBudgetUsage[agent.id] || 0) / 14) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-2 text-right">Discussion units only</div>
            </div>
            {/* Add this after the agents discussion units section */}
            {Object.entries(discussionBudgetUsage).some(([agentId, budget]) => budget > 14) && (
              <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h4 className="text-red-400 font-medium mb-1">Budget Warning</h4>
                <p className="text-sm text-gray-200">
                  Some agents have exceeded their maximum budget. Their future choices will be restricted to ensure
                  budget compliance.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {showResults ? (
            <Card className="shadow-lg overflow-hidden glow-card dark-card">
              <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
                <h3 className="text-xl font-semibold neon-text">Voting Results</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {agents.map((agent) => {
                    // Once votes are finalized, we use a stable reference to the votes
                    const voteToDisplay = votesFinalized
                      ? discussionState.votes[currentPolicy?.id]?.find((v) => v.agentId === agent.id)?.optionId ||
                        agentVotes[agent.id]
                      : agentVotes[agent.id]

                    return (
                      <div key={agent.id} className="flex items-center justify-between">
                        <div className="font-medium text-gray-100">{agent.name}</div>
                        <div className="flex items-center">
                          <span className={getOptionColorClass(voteToDisplay)}>Option {voteToDisplay || "N/A"}</span>
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex items-center justify-between border-t border-primary/20 pt-4 mt-4">
                    <div className="font-medium text-gray-100">Your Vote</div>
                    <div className="flex items-center">
                      <span className={getOptionColorClass(selectedVote)}>Option {selectedVote || "N/A"}</span>
                    </div>
                  </div>

                  {tiebreakInfo.occurred && (
                    <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                      <h4 className="font-semibold text-purple-300 mb-1">Tie Breaker</h4>
                      <p className="text-sm text-gray-100">
                        There was a tie between Options{" "}
                        {tiebreakInfo.options.map((opt, i) => (
                          <span key={opt}>
                            <span
                              className={
                                opt === 1
                                  ? "text-green-400 font-bold"
                                  : opt === 2
                                    ? "text-blue-400 font-bold"
                                    : "text-orange-400 font-bold"
                              }
                            >
                              {opt}
                            </span>
                            {i < tiebreakInfo.options.length - 1 ? ", " : ""}
                          </span>
                        ))}
                        . Option{" "}
                        <span
                          className={
                            tiebreakInfo.winner === 1
                              ? "text-green-400 font-bold"
                              : tiebreakInfo.winner === 2
                                ? "text-blue-400 font-bold"
                                : "text-orange-400 font-bold"
                          }
                        >
                          {tiebreakInfo.winner}
                        </span>{" "}
                        was randomly selected as the winner.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-primary/20">
                    <h4 className="font-semibold mb-2 neon-text">Final Decision</h4>
                    <p className="text-sm text-gray-100">
                      Based on the votes from all parliament members,{" "}
                      <span
                        className={`font-bold ${
                          finalOption === 1 ? "text-green-400" : finalOption === 2 ? "text-blue-400" : "text-orange-400"
                        }`}
                      >
                        Option {finalOption}
                      </span>{" "}
                      has been selected for implementation.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      This decision was made with {maxVotes} out of {totalVotes} votes.
                    </p>
                  </div>
                </div>
                {showResults && (
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <p className="text-xs text-gray-400">
                      Votes have been {votesFinalized ? "finalized" : "calculated"} and will not change.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg overflow-hidden glow-card dark-card">
              <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
                <h3 className="text-xl font-semibold neon-text">Agent Opinions</h3>
              </CardHeader>
              <CardContent className="p-6">
                {isAnalyzing ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-gray-100">Analyzing agent opinions...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 text-secondary mr-2" />
                        <h4 className="font-semibold text-secondary">Confidential Voting</h4>
                      </div>
                      <p className="text-sm text-gray-100">
                        All parliament members will cast their votes confidentially. The final decision will be based on
                        majority vote.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
              <h3 className="text-xl font-semibold neon-text">Your Vote</h3>
            </CardHeader>
            <CardContent className="p-6">
              <p className="mb-6 text-gray-100">
                Based on the discussion, which option do you support for this policy?
              </p>

              <div className="flex flex-col gap-4">
                {currentPolicy.options.map((option) => {
                  const isDisabled = shouldDisableOption(option.weight) || isSubmitting || showResults

                  return (
                    <Button
                      key={option.id}
                      variant={selectedVote === option.id ? "default" : "outline"}
                      className={`h-16 text-lg justify-start px-6 ${
                        selectedVote === option.id
                          ? option.id === 1
                            ? "bg-green-600 hover:bg-green-700"
                            : option.id === 2
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-orange-600 hover:bg-orange-700"
                          : isDisabled && !showResults && !isSubmitting
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                      }`}
                      onClick={() => !showResults && handleVote(option.id)}
                      disabled={isDisabled}
                    >
                      <div className="flex justify-between w-full items-center">
                        <div className="flex items-center">
                          <Check className="h-5 w-5 mr-2" />
                          Option {option.id}
                        </div>
                        {isDisabled && !showResults && !isSubmitting && (
                          <div className="text-xs bg-red-900/30 border border-red-500/30 rounded px-2 py-1 ml-2">
                            Insufficient budget for remaining questions
                          </div>
                        )}
                      </div>
                    </Button>
                  )
                })}

                {isSubmitting && (
                  <div className="flex items-center justify-center mt-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-gray-100">Submitting your vote...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" disabled={true} className="neon-button-secondary opacity-70">
            <Lock className="mr-2 h-4 w-4" />
            No Going Back
          </Button>

          {showResults && (
            <Button onClick={handleContinue} className="neon-button">
              Continue to {policyId === policyQuestions.length ? "Summary" : "Next Policy"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
