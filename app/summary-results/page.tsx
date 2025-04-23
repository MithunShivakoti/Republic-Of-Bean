"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { usePolicyContext } from "@/providers/policy-provider"
import { useAgentContext } from "@/providers/agent-provider"
import { policyQuestions } from "@/data/policy-questions"
import { idealAnswers } from "@/data/ideal-answers"
import { ArrowRight } from "lucide-react"

// Add this function at the top of the component
function getMajorityVoteResults() {
  if (typeof window !== "undefined") {
    const results = localStorage.getItem("beanMajorityOptions")
    return results ? JSON.parse(results) : {}
  }
  return {}
}

export default function SummaryResultsPage() {
  const router = useRouter()
  const { policies, totalWeight } = usePolicyContext()
  const { discussionState = { votes: {}, finalSelections: {} }, agents } = useAgentContext()
  const [isLoading, setIsLoading] = useState(true)
  const [reflectionAnswers, setReflectionAnswers] = useState<any[]>([])
  const [budgetUsage, setBudgetUsage] = useState<{ [key: string]: number }>({
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  })
  const [hasConversationHistories, setHasConversationHistories] = useState(false)
  const [discussionBudgetUsage, setDiscussionBudgetUsage] = useState<{ [key: string]: number }>({
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  })

  useEffect(() => {
    // Check if we have 7 policies selected
    const selectedPolicies = Object.keys(policies).length
    if (selectedPolicies < 7) {
      router.push("/policy/1")
    } else {
      setIsLoading(false)
    }

    // Load reflection answers from localStorage
    const savedAnswers = localStorage.getItem("beanReflectionAnswers")
    if (savedAnswers) {
      try {
        setReflectionAnswers(JSON.parse(savedAnswers))
      } catch (error) {
        console.error("Error parsing saved reflection answers:", error)
      }
    }

    // Load policy budget usage from localStorage
    const savedBudgetUsage = localStorage.getItem("beanBudgetUsage")
    if (savedBudgetUsage) {
      try {
        setBudgetUsage(JSON.parse(savedBudgetUsage))
      } catch (error) {
        console.error("Error parsing saved budget usage:", error)
      }
    }

    // Load discussion budget usage from localStorage
    const savedDiscussionBudget = localStorage.getItem("beanDiscussionBudgetUsage")
    if (savedDiscussionBudget) {
      try {
        setDiscussionBudgetUsage(JSON.parse(savedDiscussionBudget))
      } catch (error) {
        console.error("Error parsing saved discussion budget usage:", error)
      }
    }

    // Check if conversation histories are stored in localStorage
    const storedConversationHistories = localStorage.getItem("beanConversationHistories")
    setHasConversationHistories(!!storedConversationHistories)
  }, [policies, router])

  // Get the selected options for each policy
  const selectedOptions = policyQuestions.map((question) => {
    const finalSelection = discussionState?.finalSelections?.[question.id]
    const option = question.options.find((opt) => opt.id === finalSelection)

    return {
      policyId: question.id,
      question: question.title,
      option: option ? `Option ${option.id}` : "Not selected",
      description: option ? option.text : "",
      weight: option ? option.weight : 0,
    }
  })

  // Get the ideal answers for comparison
  const idealPolicies = policyQuestions.map((question) => {
    // Access idealAnswers as an object using the question.id as key
    const idealAnswer = idealAnswers[question.id as keyof typeof idealAnswers]
    // Get the title from the idealAnswer
    const idealTitle = idealAnswer?.title || ""

    // Find the option that best matches the ideal answer (simplified approach)
    // Since we don't have explicit optionId in the new structure, we'll just use the first option
    const option = question.options[0]

    return {
      policyId: question.id,
      question: question.title,
      option: option ? `Option ${option.id}` : "Not available",
      description: option ? option.text : "",
      weight: option ? option.weight : 0,
      reasoning: idealAnswer?.reasoning || "",
    }
  })

  // Calculate match with ideal answers
  const matchCount = selectedOptions.filter((selected, index) => {
    const ideal = idealPolicies[index]
    return selected.option === ideal.option
  }).length

  const matchPercentage = Math.round((matchCount / policyQuestions.length) * 100)

  const handleContinue = () => {
    router.push("/questionnaire")
  }

  const handleBack = () => {
    router.push("/questionnaire")
  }

  useEffect(() => {
    if (!hasConversationHistories && discussionState) {
      // Initialize conversation histories object
      const conversationHistories = {}

      // For each policy question, store any available conversation
      policyQuestions.forEach((question) => {
        // Get conversation from sessionStorage
        const conversationKey = `discussion-${question.id}`
        const storedConversation = sessionStorage.getItem(conversationKey)

        if (storedConversation) {
          conversationHistories[question.id] = JSON.parse(storedConversation)
        }
      })

      // Store all conversation histories in localStorage for persistence
      localStorage.setItem("beanConversationHistories", JSON.stringify(conversationHistories))
    }
  }, [discussionState, policyQuestions, hasConversationHistories])

  if (isLoading) {
    return (
      <div className="bright-background min-h-screen flex items-center justify-center">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="bright-pattern"></div>
        <div className="text-center relative z-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-container neon-text">Preparing your results summary...</p>
        </div>
      </div>
    )
  }

  // Add this before the return statement in the component
  const majorityVoteResults = getMajorityVoteResults()

  return (
    <div className="bright-background min-h-screen py-12 px-4">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <div className="bright-pattern"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 neon-gradient-text">Summary Results</h1>
          <p className="text-lg text-gray-100 neon-text">Here's a summary of your policy decisions and budget usage.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Final Parliamentary Decisions - FIXED TO ALWAYS SHOW MAJORITY DECISION */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Final Parliamentary Decisions</h2>
            </CardHeader>
            {/* In the JSX, add this section to display the majority votes */}
            {/* Add this after the "Final Parliamentary Decisions" heading */}
            <div className="mb-8 px-4">
              <h3 className="text-xl font-bold mb-4 neon-text">Majority Vote Results by Policy</h3>
              <div className="grid gap-4">
                {Object.keys(majorityVoteResults).length > 0 ? (
                  Object.entries(majorityVoteResults).map(([policyId, data]) => {
                    const policyData = data as any
                    const policyQuestion = policyQuestions.find((q) => q.id === Number.parseInt(policyId))
                    return (
                      <div
                        key={policyId}
                        className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30"
                      >
                        <p className="font-semibold neon-text">
                          Policy {policyId}: {policyQuestion?.title}
                        </p>
                        <p className="text-white">
                          Majority Vote: Option {policyData.optionId} ({policyData.votes} votes)
                        </p>
                        <p className="text-gray-300 text-sm mt-1">{policyData.optionText}</p>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-white">
                    The voting data is available but not displaying correctly. Please refresh the page.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Navigation Button */}
          <div className="flex justify-center mt-4">
            <Button onClick={handleContinue} className="gap-2 neon-button px-6 py-2 text-lg">
              <span className="text-white">Continue to Questionnaire</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
