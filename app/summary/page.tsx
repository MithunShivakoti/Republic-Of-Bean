"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { usePolicyContext } from "@/providers/policy-provider"
import { policyQuestions } from "@/data/policy-questions"
import { ArrowLeft, ArrowRight, DollarSign, RefreshCw, AlertTriangle } from "lucide-react"
import { PolicyIcons } from "@/components/policy-icons"

export default function SummaryPage() {
  const router = useRouter()
  const { policies, totalWeight, resetPolicies, areAllSelectionsIdentical } = usePolicyContext()
  const [isLoading, setIsLoading] = useState(true)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    // Check if we have 7 policies selected
    const selectedPolicies = Object.keys(policies).length
    if (selectedPolicies < 7) {
      router.push("/policy/1")
    } else {
      setIsLoading(false)

      // Check if all selections are identical
      if (areAllSelectionsIdentical()) {
        setShowWarning(true)
      }
    }
  }, [policies, router, areAllSelectionsIdentical])

  const handleBack = () => {
    router.push("/policy/7")
  }

  const handleContinue = () => {
    if (areAllSelectionsIdentical()) {
      setShowWarning(true)
      return
    }
    router.push("/results")
  }

  const handleReset = () => {
    resetPolicies()
    router.push("/policy/1")
  }

  // Get the selected options for each policy
  const selectedOptions = policyQuestions.map((question) => {
    const policy = policies[question.id]
    if (!policy) return null

    const option = question.options.find((opt) => opt.id === policy.id)
    return {
      policyId: question.id,
      question: question.title,
      option: option ? `Option ${option.id}` : "Not selected",
      description: option ? option.text : "",
      weight: policy.weight,
    }
  })

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
          <p className="text-container neon-text">Loading your policy selections...</p>
        </div>
      </div>
    )
  }

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
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 neon-gradient-text">Review Your Policy Selections</h1>
          <p className="text-gray-100 text-container inline-block neon-text">
            Please review your policy selections before finalizing your decisions
          </p>
        </div>

        {showWarning && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-100">
              <strong>Warning:</strong> You have selected the same option for all policies. You must choose at least one
              different option across all policies to continue.
            </p>
          </div>
        )}

        <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
          <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold neon-text">Your Policy Selections</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full shadow-sm">
                <DollarSign className="h-4 w-4 text-primary neon-text-primary" />
                <span className="text-gray-100">
                  Budget Used: <span className="font-bold text-primary neon-text-primary">{totalWeight}</span>/14 units
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 dark-card">
            <div className="grid gap-6">
              {selectedOptions.map((item, index) => {
                if (!item) return null
                return (
                  <div key={index} className="policy-card">
                    <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <PolicyIcons policyId={item.policyId} className="h-5 w-5 text-primary" />
                          <h3 className="font-bold neon-text">{item.question}</h3>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium option-badge-${item.weight}`}>
                          {item.weight} unit{item.weight !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex gap-2 items-start">
                        <div>
                          <p className="font-medium text-gray-100 neon-text">{item.option}</p>
                          <p className="text-sm text-gray-100 mt-1">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-primary/20">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="gap-2 neon-button-secondary">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2 neon-button-secondary">
                <RefreshCw className="h-4 w-4" />
                Reset Selections
              </Button>
            </div>
            <Button onClick={handleContinue} disabled={areAllSelectionsIdentical()} className="gap-2 neon-button">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
