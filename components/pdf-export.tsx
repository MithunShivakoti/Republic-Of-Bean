"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface PdfExportProps {
  policies: any[]
  reflections?: any[]
  budgetUsage?: { [key: string]: number }
  agents?: any[]
  parliamentaryDecisions?: any[]
}

interface UserData {
  age: string
  nationality: string
  occupation: string
  educationLevel: string
  displacementExperience: string
  displacementNarrative?: string
  city: string
  country: string
}

export function PDFExport({
  policies,
  reflections = [],
  budgetUsage = {},
  agents = [],
  parliamentaryDecisions = [],
}: PdfExportProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserData = localStorage.getItem("beanUserData")
      if (storedUserData) {
        try {
          setUserData(JSON.parse(storedUserData))
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
    }
  }, [])

  // Update the generatePdf function to include unsanitized agent information
  const generatePdf = async () => {
    setIsGenerating(true)

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
      const policyData = policies.map((policy) => [
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
        const discussionUnitsUsed = budgetUsage[`${agent.id}_discussion`] || 0

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
      if (reflections && reflections.length > 0) {
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

        reflections.forEach((reflection, index) => {
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

      // Save the PDF
      doc.save("republic-of-bean-results.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating your PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generatePdf} disabled={isGenerating} className="gap-2 neon-button-secondary">
      {isGenerating ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          <span>Export Results as PDF</span>
        </>
      )}
    </Button>
  )
}
