"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { usePolicyContext } from "@/providers/policy-provider"
import { useAgentContext } from "@/providers/agent-provider"
import { policyQuestions } from "@/data/policy-questions"
import { Award, CheckCircle, DollarSign, Users } from "lucide-react"

export default function ResultsPage() {
  const router = useRouter()
  const { policies, totalWeight, resetPolicies, areAllSelectionsIdentical } = usePolicyContext()
  const { discussionState, getFinalSelection } = useAgentContext()
  const [isLoading, setIsLoading] = useState(true)
  const [shareUrl, setShareUrl] = useState("")
  const [firstRoundResults, setFirstRoundResults] = useState<{
    policies: any
    totalWeight: number
    optionCounts: { 1: number; 2: number; 3: number }
    selectedOptions: any[]
    timestamp: string
  } | null>(null)

  // Create confetti elements
  useEffect(() => {
    if (!isLoading) {
      const confettiCount = 50
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "0"
      container.style.width = "100%"
      container.style.height = "100%"
      container.style.pointerEvents = "none"
      container.style.zIndex = "100"

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement("div")
        confetti.className = "confetti"
        confetti.style.left = `${Math.random() * 100}%`
        confetti.style.animationDuration = `${Math.random() * 3 + 2}s`
        confetti.style.animationDelay = `${Math.random() * 2}s`
        container.appendChild(confetti)
      }

      document.body.appendChild(container)

      return () => {
        document.body.removeChild(container)
      }
    }
  }, [isLoading])

  useEffect(() => {
    // Check if we have 7 policies selected
    const selectedPolicies = Object.keys(policies).length
    if (selectedPolicies < 7) {
      router.push("/policy/1")
    } else if (areAllSelectionsIdentical()) {
      // If all selections are identical, go back to summary page
      router.push("/summary")
    } else {
      setIsLoading(false)

      // Generate shareable URL
      const policyString = Object.entries(policies)
        .map(([policyId, option]) => `${policyId}-${option.id}`)
        .join("_")

      const url = `${window.location.origin}/shared?p=${policyString}`
      setShareUrl(url)
    }
  }, [policies, router, areAllSelectionsIdentical])

  // Save first round results
  useEffect(() => {
    if (!isLoading && Object.keys(policies).length === 7) {
      // Get the selected options for each policy
      const selectedOptionsData = policyQuestions
        .map((question) => {
          const policy = policies[question.id]
          if (!policy) return null

          const option = question.options.find((opt) => opt.id === policy.id)
          return {
            questionId: question.id,
            question: question.title,
            optionId: policy.id,
            optionText: option ? option.text : "",
            weight: policy.weight,
          }
        })
        .filter(Boolean)

      // Count the distribution of option types
      const optionCountsData = {
        1: 0,
        2: 0,
        3: 0,
      }

      Object.values(policies).forEach((policy) => {
        optionCountsData[policy.id as keyof typeof optionCountsData]++
      })

      // Save all data in firstRoundResults
      setFirstRoundResults({
        policies: { ...policies },
        totalWeight,
        optionCounts: optionCountsData,
        selectedOptions: selectedOptionsData,
        timestamp: new Date().toISOString(),
      })

      // Also save to localStorage for persistence
      localStorage.setItem(
        "beanFirstRoundResults",
        JSON.stringify({
          policies: { ...policies },
          totalWeight,
          optionCounts: optionCountsData,
          selectedOptions: selectedOptionsData,
          timestamp: new Date().toISOString(),
        }),
      )

      console.log("First round results saved:", firstRoundResults)
    }
  }, [isLoading, policies, totalWeight])

  const handleReset = () => {
    resetPolicies()
    router.push("/")
  }

  const handleContinueToDiscussion = () => {
    router.push("/discussion-intro")
  }

  const handleRestartSection = (section: string) => {
    if (section === "policy") {
      router.push("/policy/1")
    } else if (section === "discussion") {
      router.push("/discussion-intro")
    }
  }

  const handleExportPDF = async () => {
    const summaryElement = document.getElementById("policy-summary")
    if (!summaryElement) return

    try {
      // Dynamically import jsPDF and html2canvas
      const { jsPDF } = await import("jspdf")
      const html2canvas = await import("html2canvas")

      const canvas = await html2canvas.default(summaryElement, {
        scale: 2,
        backgroundColor: "#0a0a1a",
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      // Add metadata
      const timestamp = new Date().toLocaleString()
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated on: ${timestamp}`, 10, imgHeight + 10)
      pdf.text(`User: Parliament Member`, 10, imgHeight + 15)

      pdf.save("Republic-of-Bean-Policy-Selections.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  const handleShareLink = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert("Shareable link copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy link:", err)
      })
  }

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
          <p className="text-container neon-text">Compiling your policy package...</p>
        </div>
      </div>
    )
  }

  // Get the selected options for each policy
  const selectedOptions = policyQuestions.map((question) => {
    const policy = policies[question.id]
    if (!policy) return null

    const option = question.options.find((opt) => opt.id === policy.id)
    return {
      question: question.title,
      option: option ? `Option ${option.id}` : "Not selected",
      description: option ? option.text : "",
      weight: policy.weight,
    }
  })

  // Count the distribution of option types
  const optionCounts = {
    1: 0,
    2: 0,
    3: 0,
  }

  Object.values(policies).forEach((policy) => {
    optionCounts[policy.id as keyof typeof optionCounts]++
  })

  // Check if parliamentary decisions are available
  const hasParliamentaryDecisions = Object.keys(discussionState.finalSelections).length > 0

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
          <div className="inline-flex items-center justify-center p-6 bg-primary/20 border border-primary/30 rounded-full mb-4 shadow-lg">
            <Award className="h-12 w-12 text-primary neon-text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 neon-gradient-text">Your Policy Package</h1>
          <p className="text-gray-100 text-container inline-block neon-text">
            You've successfully created a refugee education policy package for the Republic of Bean
          </p>
        </div>

        <div id="policy-summary">
          <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold neon-text">Individual Policy Decisions</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full shadow-sm">
                  <DollarSign className="h-4 w-4 text-primary neon-text-primary" />
                  <span className="text-gray-100">
                    Budget Used: <span className="font-bold text-primary neon-text-primary">{totalWeight}</span>/14
                    units
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 dark-card">
              {/* Option distribution summary */}
              <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <h3 className="text-lg font-medium mb-3 neon-text">Policy Option Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">{optionCounts[1]}</div>
                    <div className="text-sm text-gray-300">Option 1 selections</div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-600/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">{optionCounts[2]}</div>
                    <div className="text-sm text-gray-300">Option 2 selections</div>
                  </div>
                  <div className="bg-orange-900/20 border border-orange-600/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-400">{optionCounts[3]}</div>
                    <div className="text-sm text-gray-300">Option 3 selections</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {selectedOptions.map((item, index) => {
                  if (!item) return null
                  return (
                    <div key={index} className="policy-card">
                      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold neon-text">{item.question}</h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium option-badge-${item.weight}`}>
                            {item.weight} unit{item.weight !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex gap-2 items-start">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5 neon-text-primary" />
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
            <CardFooter className="flex flex-col gap-4 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-primary/20">
              <div className="w-full p-4 bg-primary/10 border border-primary/30 rounded-lg text-center shadow-md">
                <p className="font-medium text-gray-100 neon-text">
                  Total Budget Used: <span className="font-bold text-primary neon-text-primary">{totalWeight}</span>/14
                  units
                </p>
                <p className="text-sm text-gray-100 mt-1">
                  You've made decisions across all 7 policy areas to create a balanced approach.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* PDF export button removed */}

        <div className="flex justify-center w-full">
          <Button onClick={handleContinueToDiscussion} className="px-8 py-6 text-lg gap-2 neon-button">
            <Users className="h-5 w-5" />
            Continue to Parliamentary Discussion
          </Button>
        </div>

        {/* Debug button to view first round results */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => console.log("First Round Results:", firstRoundResults)}
            variant="outline"
            className="text-xs border-primary/30 text-primary/70"
          >
            Debug: View First Round Results
          </Button>
        </div>
      </div>
    </div>
  )
}
