"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { usePolicyContext } from "@/providers/policy-provider"
import { useAgentContext } from "@/providers/agent-provider"
import { policyQuestions } from "@/data/policy-questions"
import { ArrowLeft, ArrowRight, DollarSign, Lightbulb, AlertTriangle, Info } from "lucide-react"
import { PolicySidebar } from "@/components/policy-sidebar"
import { PolicyIcons } from "@/components/policy-icons"
import { CompareOptionsModal } from "@/components/compare-options-modal"

export default function PolicyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const policyId = Number.parseInt(params.id)
  const { policies, totalWeight, selectPolicy, areAllSelectionsIdentical } = usePolicyContext()
  const { generateInitialAgentVotes, hasInitialVotes } = useAgentContext()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showTip, setShowTip] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [initialVotesGenerated, setInitialVotesGenerated] = useState(false)

  const question = policyQuestions.find((q) => q.id === policyId)

  // If we've gone beyond the available questions, redirect to results
  useEffect(() => {
    if (policyId > policyQuestions.length) {
      router.push("/summary")
    }
  }, [policyId, router])

  // Set the selected option if it exists in the context
  useEffect(() => {
    if (policies[policyId]) {
      setSelectedOption(policies[policyId].id)
    } else {
      setSelectedOption(null)
    }
  }, [policies, policyId])

  // Generate initial agent votes when first visiting policy page
  useEffect(() => {
    if (policyId === 1 && !hasInitialVotes && !initialVotesGenerated) {
      // Only generate initial votes once when starting the policy voting
      generateInitialAgentVotes()
      setInitialVotesGenerated(true)
    }
  }, [policyId, generateInitialAgentVotes, hasInitialVotes, initialVotesGenerated])

  if (!question) {
    return (
      <div className="bright-background min-h-screen flex items-center justify-center">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="bright-pattern"></div>
        <div className="text-center relative z-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-container neon-text">Loading policy question...</p>
        </div>
      </div>
    )
  }

  const handleOptionSelect = (optionId: number) => {
    const option = question.options.find((o) => o.id === optionId)
    if (option) {
      // If this option is already selected, we don't need to check the weight
      if (policies[policyId] && policies[policyId].id === optionId) {
        setSelectedOption(optionId)
        return
      }

      // Calculate what the new total weight would be
      const currentOptionWeight = policies[policyId]?.weight || 0
      const newTotalWeight = totalWeight - currentOptionWeight + option.weight

      // Only allow selection if it doesn't exceed the budget
      if (newTotalWeight <= 14) {
        setSelectedOption(optionId)
        selectPolicy(policyId, optionId, option.weight)
        setShowWarning(false)
      } else {
        setWarningMessage(
          `Careful! This option will push you over budget. Current total: ${totalWeight - currentOptionWeight}, This option: ${option.weight}`,
        )
        setShowWarning(true)
      }
    }
  }

  const handleNext = () => {
    if (selectedOption !== null) {
      // If this is the last policy and all selections are identical, show warning
      if (policyId === policyQuestions.length && areAllSelectionsIdentical()) {
        setWarningMessage(
          "You cannot select the same option for all policies. Please choose at least one different option.",
        )
        setShowWarning(true)
        return
      }

      // Navigate to summary page if this is the last policy
      if (policyId === policyQuestions.length) {
        router.push("/summary")
      } else {
        router.push(`/policy/${policyId + 1}`)
      }
    } else {
      setWarningMessage("You haven't selected a policy option yet. It's a key part of your plan!")
      setShowWarning(true)
    }
  }

  const handleBack = () => {
    router.push(policyId === 1 ? "/meet-agents" : `/policy/${policyId - 1}`)
  }

  const progress = (policyId / policyQuestions.length) * 100

  return (
    <div className="bright-background min-h-screen py-12 px-4">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <div className="bright-pattern"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 shadow-md flex items-center justify-center text-primary font-bold neon-text-primary">
                  {policyId}
                </div>
                <span className="ml-2 text-sm font-medium bg-primary/10 border border-primary/30 px-3 py-1 rounded-full shadow-sm text-gray-100 neon-text">
                  Policy {policyId} of {policyQuestions.length}
                </span>
              </div>

              <div className="budget-display">
                <DollarSign className="h-4 w-4 text-primary neon-text-primary" />
                <span>
                  Budget: <span className="font-bold text-primary neon-text-primary">{totalWeight}</span>/14 units
                </span>
              </div>
            </div>

            <div className="progress-container mb-8">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            {/* Policy selection rule reminder */}
            <div className="mb-4 p-4 bg-secondary/10 border border-secondary/30 rounded-lg flex items-start gap-3">
              <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <p className="text-gray-100">
                <span className="font-bold text-secondary">Remember:</span> You must select at least one different
                option across all policies. You cannot choose the same option for all seven policy decisions.
              </p>
            </div>

            {showWarning && (
              <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-100">{warningMessage}</p>
              </div>
            )}

            <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
              <CardHeader className="policy-card-header">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <PolicyIcons policyId={policyId} className="h-6 w-6 text-primary" />
                    <div>
                      <h2 className="text-2xl font-bold mb-2 neon-text">{question.title}</h2>
                      <p className="text-gray-100">{question.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CompareOptionsModal policyId={policyId} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-primary/10 border border-primary/30"
                      onClick={() => setShowTip(!showTip)}
                    >
                      <Lightbulb
                        className={`h-5 w-5 ${showTip ? "text-yellow-400 neon-text-secondary" : "text-gray-400"}`}
                      />
                    </Button>
                  </div>
                </div>

                {showTip && (
                  <div className="mt-4 p-4 bg-secondary/10 border border-secondary/30 rounded-lg text-sm shadow-md">
                    <p className="text-yellow-100 neon-text-secondary">
                      <strong>Tip:</strong> Consider how this policy will affect both refugee integration and resource
                      allocation. Remember that your total budget across all policies cannot exceed 14 units.
                    </p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-6 space-y-4 dark-card">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`option-card cursor-pointer ${selectedOption === option.id ? "selected" : ""} hover:scale-[1.01] transition-transform`}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <div className={`option-badge option-badge-${option.weight}`}>
                      {option.weight} unit{option.weight !== 1 ? "s" : ""}
                    </div>

                    <h3 className="text-lg font-medium mb-2 neon-text">Option {option.id}</h3>
                    <p className="text-gray-100">{option.text}</p>
                  </div>
                ))}
              </CardContent>

              <CardFooter className="flex justify-between p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-primary/20">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 bg-primary/10 text-gray-100 border-primary/30 neon-button-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-white">Back</span>
                </Button>
                <Button onClick={handleNext} disabled={selectedOption === null} className="gap-2 neon-button">
                  <span className="text-white">
                    {policyId === policyQuestions.length ? "Review Selections" : "Next"}
                  </span>
                  {policyId !== policyQuestions.length && <ArrowRight className="h-4 w-4" />}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <PolicySidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
