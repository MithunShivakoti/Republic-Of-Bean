"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { usePolicyContext } from "@/providers/policy-provider"
import { useAgentContext } from "@/providers/agent-provider"
import { policyQuestions } from "@/data/policy-questions"
import { PDFExport } from "@/components/pdf-export"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export default function FinalFeedbackPage() {
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
  const [discussionBudgetUsage, setDiscussionBudgetUsage] = useState<{ [key: string]: number }>({
    user: 0,
    agent1: 0,
    agent2: 0,
    agent3: 0,
    agent4: 0,
  })
  const [emailSent, setEmailSent] = useState(false)

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

  // Get the parliamentary decisions
  const parliamentaryDecisions = policyQuestions.map((question) => {
    const finalSelectionId = discussionState?.finalSelections?.[question.id]
    const selectedOption = question.options.find((opt) => opt.id === finalSelectionId) || question.options[0]

    return {
      policyId: question.id,
      question: question.title,
      selectedOption: selectedOption.id,
      optionText: selectedOption.text,
      weight: selectedOption.weight,
    }
  })

  useEffect(() => {
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

    setIsLoading(false)
  }, [])

  // Function to silently generate and send PDF
  const silentlyGenerateAndSendPdf = async () => {
    if (emailSent) return // Prevent duplicate emails

    try {
      const doc = new jsPDF()

      // Title
      doc.setFontSize(20)
      doc.setTextColor(44, 62, 80)
      doc.text("Republic of Bean - Simulation Results", 105, 20, { align: "center" })

      // Subtitle
      doc.setFontSize(12)
      doc.setTextColor(52, 73, 94)
      doc.text("Parliamentary Simulation Summary", 105, 30, { align: "center" })

      // Date
      doc.setFontSize(10)
      doc.setTextColor(127, 140, 141)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 38, { align: "center" })

      // User Information Section
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Participant Information", 14, 50)

      // Load user data from localStorage
      const storedUserData = localStorage.getItem("beanUserData")
      let userData = null
      if (storedUserData) {
        try {
          userData = JSON.parse(storedUserData)
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }

      if (userData) {
        const userDataArray = [
          ["Age", userData.age],
          ["Nationality", userData.nationality],
          ["Occupation", userData.occupation],
          ["Educational Level", userData.educationLevel],
          ["Displacement Experience", userData.displacementExperience],
          ["Current Location", `${userData.city}, ${userData.country}`],
        ]

        // Add displacement narrative if available
        if (userData.displacementExperience === "Yes" && userData.displacementNarrative) {
          userDataArray.push(["Displacement Details", userData.displacementNarrative])
        }

        autoTable(doc, {
          startY: 55,
          head: [["Field", "Information"]],
          body: userDataArray,
          theme: "striped",
          headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: "auto" },
          },
        })
      } else {
        doc.setFontSize(12)
        doc.setTextColor(52, 73, 94)
        doc.text("User information not available", 14, 55)
      }

      // Individual Policy Decisions Section
      const userInfoY = userData ? (doc as any).lastAutoTable.finalY + 15 : 65
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Individual Policy Decisions", 14, userInfoY)

      // Policy Table
      const policyData = selectedOptions.map((policy) => [
        `Policy ${policy.policyId}: ${policy.question}`,
        policy.option,
        `${policy.weight} unit${policy.weight !== 1 ? "s" : ""}`,
      ])

      autoTable(doc, {
        startY: userInfoY + 5,
        head: [["Policy", "Selected Option", "Budget"]],
        body: policyData,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
      })

      // Parliamentary Voting Results Section
      const parliamentaryY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Parliamentary Voting Results", 14, parliamentaryY)

      // Get all parliamentary decisions
      const parliamentaryData = parliamentaryDecisions.map((decision) => [
        `Policy ${decision.policyId}: ${decision.question}`,
        `Option ${decision.selectedOption}: ${decision.optionText}`,
        `${decision.weight} unit${decision.weight !== 1 ? "s" : ""}`,
      ])

      autoTable(doc, {
        startY: parliamentaryY + 5,
        head: [["Policy", "Final Decision", "Budget"]],
        body: parliamentaryData,
        theme: "striped",
        headStyles: { fillColor: [46, 204, 113], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
      })

      // Budget Usage Section
      const budgetY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Budget Analysis", 14, budgetY)

      // User Budget
      doc.setFontSize(12)
      doc.setTextColor(52, 73, 94)
      doc.text(`Your Budget Usage: ${budgetUsage.user || 0}/14 units`, 14, budgetY + 10)

      // Agent Budget Table
      const agentData = agents.map((agent) => {
        const policyBudgetUsed = budgetUsage[agent.id] || 0
        const discussionUnitsUsed = discussionBudgetUsage[agent.id] || 0

        // Calculate adjusted policy budget (policy budget - discussion units)
        const adjustedPolicyBudget = Math.max(0, policyBudgetUsed - discussionUnitsUsed)

        return [agent.name.split(" - ")[0], `${adjustedPolicyBudget}/14 units`, `${discussionUnitsUsed}/14 units`]
      })

      autoTable(doc, {
        startY: budgetY + 15,
        head: [["Agent", "Policy Budget Used", "Discussion Units Used"]],
        body: agentData,
        theme: "striped",
        headStyles: { fillColor: [142, 68, 173], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
      })

      // Add Agent Full Profiles Section
      const agentProfilesY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Agent Profiles (Confidential)", 14, agentProfilesY)

      let currentY = agentProfilesY + 10

      // Add each agent's full profile
      for (const agent of agents) {
        // Find extended profile
        const extendedProfile = agents.find((p) => p.id === agent.id)

        if (!extendedProfile) continue

        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage()
          currentY = 20
        }

        // Agent name and role
        doc.setFontSize(12)
        doc.setTextColor(52, 73, 94)
        doc.text(`${agent.name} - ${agent.role}`, 14, currentY)
        currentY += 8

        // Background
        doc.setFontSize(10)
        doc.setTextColor(44, 62, 80)
        doc.text("Background:", 14, currentY)

        const backgroundText = agent.background || "No background information available."
        const backgroundLines = doc.splitTextToSize(backgroundText, 180)
        doc.text(backgroundLines, 14, currentY + 5)
        currentY += 10 + backgroundLines.length * 5

        // Values
        doc.text("Core Values:", 14, currentY)
        currentY += 5

        const values = agent.values || []
        values.forEach((value, index) => {
          doc.text(`• ${value}`, 18, currentY)
          currentY += 5
        })

        currentY += 5

        // Add a separator line
        doc.setDrawColor(200, 200, 200)
        doc.line(14, currentY, 196, currentY)
        currentY += 10
      }

      // Reflections Section (if available)
      if (reflectionAnswers && reflectionAnswers.length > 0) {
        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage()
          currentY = 20
        } else {
          currentY += 10
        }

        doc.setFontSize(16)
        doc.setTextColor(41, 128, 185)
        doc.text("Your Reflections", 14, currentY)

        currentY += 10

        reflectionAnswers.forEach((reflection, index) => {
          // Check if we need a new page
          if (currentY > 270) {
            doc.addPage()
            currentY = 20
          }

          doc.setFontSize(12)
          doc.setTextColor(52, 73, 94)
          doc.text(`Question ${index + 1}:`, 14, currentY)

          doc.setFontSize(10)
          doc.setTextColor(44, 62, 80)

          // Split long question text into multiple lines
          const questionLines = doc.splitTextToSize(reflection.text, 180)
          doc.text(questionLines, 14, currentY + 6)

          currentY += 8 + questionLines.length * 5

          doc.setFontSize(10)
          doc.setTextColor(44, 62, 80)
          doc.text("Your Answer:", 14, currentY)

          // Split long answer text into multiple lines
          const answerLines = doc.splitTextToSize(reflection.answer, 180)
          doc.text(answerLines, 14, currentY + 6)

          currentY += 15 + answerLines.length * 5
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(10)
        doc.setTextColor(127, 140, 141)
        doc.text(
          `Republic of Bean - Parliamentary Simulation - Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" },
        )
      }

      // Get PDF as base64 string
      const pdfBase64 = doc.output("datauristring").split(",")[1]

      // Send email with PDF attachment
      const emailData = {
        to: "mshivako@asu.edu",
        subject: "Republic of Bean - Simulation Results",
        text: "Please find attached the Republic of Bean simulation results.",
        pdfBase64: pdfBase64,
        filename: "republic-of-bean-results.pdf",
      }

      // Use fetch to send the email data to our API endpoint
      const response = await fetch("/api/send-pdf-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })

      if (response.ok) {
        console.log("Email sent successfully")
        setEmailSent(true)
      } else {
        console.error("Failed to send email:", await response.text())
      }
    } catch (error) {
      console.error("Error generating and sending PDF:", error)
    }
  }

  // Call the function to silently generate and send PDF when component mounts
  useEffect(() => {
    if (!isLoading && !emailSent) {
      silentlyGenerateAndSendPdf()
    }
  }, [isLoading, emailSent])

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
          <p className="text-container neon-text">Preparing your final feedback...</p>
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
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 neon-gradient-text">Thank You for Participating</h1>
          <p className="text-lg text-gray-100 neon-text">
            Your participation in the Republic of Bean simulation has been valuable.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Final Parliamentary Decisions */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Final Parliamentary Decisions</h2>
            </CardHeader>
            <CardContent className="p-4 dark-card">
              <div className="grid gap-4">
                {parliamentaryDecisions.map((decision) => (
                  <div
                    key={decision.policyId}
                    className="p-3 border border-primary/30 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10"
                  >
                    <h3 className="font-bold neon-text">{decision.question}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          <span className="text-primary">Final Decision:</span> Option {decision.selectedOption}
                        </p>
                        <p className="text-gray-100 mt-1">{decision.optionText}</p>
                      </div>
                      <div
                        className={`px-3 py-1.5 ml-3 rounded-full text-sm font-medium bg-primary/30 text-white border border-primary/50`}
                      >
                        {decision.weight} unit{decision.weight !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget Analysis */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Budget Analysis</h2>
            </CardHeader>
            <CardContent className="p-4 dark-card">
              <p className="text-white mb-4">
                Your Budget Usage: <span className="font-bold text-primary">{budgetUsage.user || 0}/14 units</span>
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-primary/30">
                      <th className="text-left py-2 px-4">Agent</th>
                      <th className="text-left py-2 px-4">Policy Budget Used</th>
                      <th className="text-left py-2 px-4">Discussion Units Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => {
                      const policyBudgetUsed = budgetUsage[agent.id] || 0
                      const discussionUnitsUsed = discussionBudgetUsage[agent.id] || 0
                      const adjustedPolicyBudget = Math.max(0, policyBudgetUsed - discussionUnitsUsed)

                      return (
                        <tr key={agent.id} className="border-b border-primary/20">
                          <td className="py-2 px-4">{agent.name.split(" - ")[0]}</td>
                          <td className="py-2 px-4">{adjustedPolicyBudget}/14 units</td>
                          <td className="py-2 px-4">{discussionUnitsUsed}/14 units</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-center mt-4">
            <PDFExport
              policies={selectedOptions}
              reflections={reflectionAnswers}
              budgetUsage={budgetUsage}
              agents={agents}
              parliamentaryDecisions={parliamentaryDecisions}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
