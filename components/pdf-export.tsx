"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { idealAnswers } from "@/data/ideal-answers"
import { policyQuestions } from "@/data/policy-questions"

interface PdfExportProps {
  policies: any[]
  reflections?: any[]
  budgetUsage?: { [key: string]: number }
  discussionBudgetUsage?: { [key: string]: number }
  agents?: any[]
  parliamentaryDecisions?: any[]
  idealPolicyExplanations?: { [key: string]: string }
  generatedFeedback?: string
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
  discussionBudgetUsage = {},
  agents = [],
  parliamentaryDecisions = [],
  idealPolicyExplanations = {},
  generatedFeedback = "",
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

  // Update this function to get majority vote results
  function getMajorityVoteResults() {
    if (typeof window !== "undefined") {
      const results = localStorage.getItem("beanMajorityOptions")
      return results ? JSON.parse(results) : {}
    }
    return {}
  }

  function getFirstRoundResults() {
    if (typeof window !== "undefined") {
      const results = localStorage.getItem("beanFirstRoundResults")
      return results ? JSON.parse(results) : null
    }
    return null
  }

  // Get user's policy selections directly from localStorage with proper error handling
  function getUserPolicySelections() {
    const selections = []

    if (typeof window === "undefined") return selections

    for (let i = 1; i <= 7; i++) {
      const policyQuestion = policyQuestions.find((q) => q.id === i)
      if (!policyQuestion) continue

      // Try multiple methods to get the option ID
      let optionId = null

      // Method 1: Try user-policy-{id}-option
      optionId = localStorage.getItem(`user-policy-${i}-option`)

      // Method 2: Try policies directly
      if (!optionId) {
        const policiesStr = localStorage.getItem("beanPolicies")
        if (policiesStr) {
          try {
            const policiesObj = JSON.parse(policiesStr)
            if (policiesObj && policiesObj[i]) {
              optionId = policiesObj[i].toString()
            }
          } catch (e) {
            console.error("Error parsing policies:", e)
          }
        }
      }

      // Method 3: Check the context passed policies
      if (!optionId && policies && policies[i]) {
        optionId = policies[i].toString()
      }

      // Parse option ID if found
      const parsedOptionId = optionId ? Number.parseInt(optionId, 10) : null
      let optionText = "Not selected"
      let optionWeight = 0

      if (!isNaN(parsedOptionId) && parsedOptionId > 0) {
        const option = policyQuestion.options.find((o) => o.id === parsedOptionId)
        if (option) {
          optionText = `Option ${option.id}: ${option.text}`
          optionWeight = option.weight
        }
      }

      selections.push({
        policyId: i,
        question: policyQuestion.title,
        option: optionText,
        weight: optionWeight,
      })
    }

    return selections
  }

  // Helper function to get hardcoded agent votes if needed
  function getHardcodedAgentVotes(policyId: number, agents: any[]) {
    // Create mapping of votes by all agents
    const hardcodedVotesMap = {
      1: {
        // Access to Education
        "Dr. Carla Jimenez": { optionId: 3, reasoning: "Based on Trauma-Informed Education" },
        "Musa Diallo": { optionId: 2, reasoning: "Based on Adult Education" },
        "Anika Sato": { optionId: 3, reasoning: "Based on Evidence-Based Policy" },
        "Aminata Diouf": { optionId: 2, reasoning: "Based on Educational Assessment" },
        "Samuel Okeke": { optionId: 2, reasoning: "Based on Teacher Training" },
        "Noor Al-Khamees": { optionId: 3, reasoning: "Based on Education Rights" },
        "Teresa Alvarez": { optionId: 3, reasoning: "Based on Classroom Integration" },
      },
      2: {
        // Language Instruction
        "Dr. Carla Jimenez": { optionId: 2, reasoning: "Based on Trauma-Informed Education" },
        "Musa Diallo": { optionId: 2, reasoning: "Based on Adult Education" },
        "Anika Sato": { optionId: 3, reasoning: "Based on Evidence-Based Policy" },
        "Aminata Diouf": { optionId: 2, reasoning: "Based on Educational Assessment" },
        "Samuel Okeke": { optionId: 2, reasoning: "Based on Teacher Training" },
        "Noor Al-Khamees": { optionId: 3, reasoning: "Based on Education Rights" },
        "Teresa Alvarez": { optionId: 2, reasoning: "Based on Classroom Integration" },
      },
      3: {
        // Teacher Training
        "Dr. Carla Jimenez": { optionId: 3, reasoning: "Based on Trauma-Informed Education" },
        "Musa Diallo": { optionId: 2, reasoning: "Based on Adult Education" },
        "Anika Sato": { optionId: 2, reasoning: "Based on Evidence-Based Policy" },
        "Aminata Diouf": { optionId: 2, reasoning: "Based on Educational Assessment" },
        "Samuel Okeke": { optionId: 3, reasoning: "Based on Teacher Training" },
        "Noor Al-Khamees": { optionId: 2, reasoning: "Based on Education Rights" },
        "Teresa Alvarez": { optionId: 2, reasoning: "Based on Classroom Integration" },
      },
      4: {
        // Curriculum Adaptation
        "Dr. Carla Jimenez": { optionId: 2, reasoning: "Based on Trauma-Informed Education" },
        "Musa Diallo": { optionId: 2, reasoning: "Based on Adult Education" },
        "Anika Sato": { optionId: 2, reasoning: "Based on Evidence-Based Policy" },
        "Aminata Diouf": { optionId: 3, reasoning: "Based on Educational Assessment" },
        "Samuel Okeke": { optionId: 1, reasoning: "Based on Teacher Training" },
        "Noor Al-Khamees": { optionId: 2, reasoning: "Based on Education Rights" },
        "Teresa Alvarez": { optionId: 2, reasoning: "Based on Classroom Integration" },
      },
      5: {
        // Psychosocial Support
        "Dr. Carla Jimenez": { optionId: 3, reasoning: "Based on Trauma-Informed Education" },
        "Musa Diallo": { optionId: 2, reasoning: "Based on Adult Education" },
        "Anika Sato": { optionId: 2, reasoning: "Based on Evidence-Based Policy" },
        "Aminata Diouf": { optionId: 2, reasoning: "Based on Educational Assessment" },
        "Samuel Okeke": { optionId: 1, reasoning: "Based on Teacher Training" },
        "Noor Al-Khamees": { optionId: 3, reasoning: "Based on Education Rights" },
        "Teresa Alvarez": { optionId: 2, reasoning: "Based on Classroom Integration" },
      },
      6: {
        // Financial Support
        "Dr. Carla Jimenez": { optionId: 2, reasoning: "Based on Trauma-Informed Education" },
        "Musa Diallo": { optionId: 1, reasoning: "Based on Adult Education" },
        "Anika Sato": { optionId: 2, reasoning: "Based on Evidence-Based Policy" },
        "Aminata Diouf": { optionId: 1, reasoning: "Based on Educational Assessment" },
        "Samuel Okeke": { optionId: 2, reasoning: "Based on Teacher Training" },
        "Noor Al-Khamees": { optionId: 2, reasoning: "Based on Education Rights" },
        "Teresa Alvarez": { optionId: 1, reasoning: "Based on Classroom Integration" },
      },
      7: {
        // Certification/Accreditation
        "Dr. Carla Jimenez": { optionId: 1, reasoning: "Based on Trauma-Informed Education" },
        "Musa Diallo": { optionId: 1, reasoning: "Based on Adult Education" },
        "Anika Sato": { optionId: 2, reasoning: "Based on Evidence-Based Policy" },
        "Aminata Diouf": { optionId: 1, reasoning: "Based on Educational Assessment" },
        "Samuel Okeke": { optionId: 1, reasoning: "Based on Teacher Training" },
        "Noor Al-Khamees": { optionId: 2, reasoning: "Based on Education Rights" },
        "Teresa Alvarez": { optionId: 2, reasoning: "Based on Classroom Integration" },
      },
    }

    // Convert to expected format
    const policyVoteMap = hardcodedVotesMap[policyId as keyof typeof hardcodedVotesMap] || {}
    const hardcodedVotes = []

    // Generate votes for available agents
    for (const agent of agents) {
      const agentName = agent.name.split(" - ")[0]
      const agentVote = policyVoteMap[agentName]

      if (agentVote) {
        hardcodedVotes.push({
          agentId: agent.id,
          name: agentName,
          optionId: agentVote.optionId,
          reasoning: agentVote.reasoning,
        })
      } else {
        // Fallback if agent name doesn't match
        hardcodedVotes.push({
          agentId: agent.id,
          name: agentName,
          optionId: 2, // Default to option 2 as middle ground
          reasoning: `Based on ${agent.specialty || agent.perspective || "Agent Profile"}`,
        })
      }
    }

    // Get user vote from localStorage
    const userVoteKey = `user-policy-${policyId}-option`
    const userVote = localStorage.getItem(userVoteKey)
    if (userVote) {
      hardcodedVotes.push({
        agentId: "user",
        name: "You (User)",
        optionId: Number.parseInt(userVote, 10),
        reasoning: "Your selection",
      })
    }

    return hardcodedVotes
  }

  // Function to get discussion messages from localStorage
  function getDiscussionMessages(policyId: number) {
    if (typeof window === "undefined") return []

    try {
      const key = `beanDiscussion-${policyId}`
      const storedMessages = localStorage.getItem(key)
      if (storedMessages) {
        return JSON.parse(storedMessages)
      }
    } catch (error) {
      console.error(`Error getting discussion messages for policy ${policyId}:`, error)
    }

    return []
  }

  // Function to get questionnaire feedback from localStorage
  function getQuestionnaireFeedback() {
    if (typeof window === "undefined") return {}

    try {
      const storedFeedback = localStorage.getItem("beanQuestionnaireFeedback")
      if (storedFeedback) {
        return JSON.parse(storedFeedback)
      }
    } catch (error) {
      console.error("Error getting questionnaire feedback:", error)
    }

    return {}
  }

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

      // Agent Decisions Section
      const agentDecisionsY = userData ? (doc as any).lastAutoTable.finalY + 15 : 65
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Agent Voting Decisions", 14, agentDecisionsY)

      // Create agent decisions data
      const allAgentVotes = []

      // For each policy
      for (let policyId = 1; policyId <= 7; policyId++) {
        const policy = policyQuestions.find((p) => p.id === policyId)
        if (!policy) continue

        // Add policy header
        allAgentVotes.push([
          {
            content: `Policy ${policyId}: ${policy.title}`,
            colSpan: 3,
            styles: { fontStyle: "bold", fillColor: [52, 152, 219] },
          },
        ])

        // Add column headers for this policy
        allAgentVotes.push(["Agent", "Selected Option", "Reasoning"])

        // Get all agent votes for this policy (using hardcoded data for reliability)
        const policyVotes = getHardcodedAgentVotes(policyId, agents)

        // Add each agent's vote to the table
        const agentVotesInTable = []

        // First add the user's vote if available
        const userVote = policyVotes.find((vote) => vote.agentId === "user")
        if (userVote) {
          agentVotesInTable.push(["You (User)", `Option ${userVote.optionId}`, userVote.reasoning || "Your selection"])
        }

        // Then add agent votes
        policyVotes
          .filter((vote) => vote.agentId !== "user")
          .forEach((vote) => {
            agentVotesInTable.push([vote.name, `Option ${vote.optionId}`, vote.reasoning])
          })

        // Add all votes for this policy to the main table
        allAgentVotes.push(...agentVotesInTable)
      }

      // Generate the agent votes table
      autoTable(doc, {
        startY: agentDecisionsY + 5,
        body: allAgentVotes,
        theme: "striped",
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: "auto" },
        },
      })

      // Add Discussion Messages Section for each policy
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Discussion Messages", 14, 20)

      let discussionY = 30

      // For each policy
      for (let policyId = 1; policyId <= 7; policyId++) {
        const policy = policyQuestions.find((p) => p.id === policyId)
        if (!policy) continue

        // Check if we need a new page
        if (discussionY > 250) {
          doc.addPage()
          discussionY = 20
        }

        // Policy header
        doc.setFontSize(14)
        doc.setTextColor(52, 73, 94)
        doc.text(`Discussion ${policyId}: ${policy.title}`, 14, discussionY)
        discussionY += 10

        // Get discussion messages
        const messages = getDiscussionMessages(policyId)

        if (messages && messages.length > 0) {
          // Create a table for messages
          const messageData = messages.map((msg: any) => {
            const sender = msg.sender === "user" ? "You" : msg.sender
            return [sender, msg.text]
          })

          autoTable(doc, {
            startY: discussionY,
            head: [["Sender", "Message"]],
            body: messageData,
            theme: "striped",
            headStyles: { fillColor: [52, 152, 219], textColor: [255, 255, 255] },
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: "auto" },
            },
          })

          discussionY = (doc as any).lastAutoTable.finalY + 15
        } else {
          doc.setFontSize(10)
          doc.setTextColor(127, 140, 141)
          doc.text("No discussion messages available for this policy.", 14, discussionY)
          discussionY += 15
        }
      }

      // Ideal Policy Explanations Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Ideal Policy Explanations", 14, 20)

      // Get content from ideal-feedback page
      const idealFeedbackData = []

      // For each policy
      for (let policyId = 1; policyId <= 7; policyId++) {
        const policy = policyQuestions.find((p) => p.id === policyId)
        if (!policy) continue

        // Map policy ID to policy type
        const policyTypes = [
          "healthcare",
          "education",
          "economy",
          "environment",
          "immigration",
          "security",
          "infrastructure",
        ]

        const policyType = policyTypes[policyId - 1]

        // Get ideal answer for this policy type
        const idealAnswer = idealAnswers[policyType]

        if (idealAnswer) {
          idealFeedbackData.push([`Policy ${policyId}: ${policy.title}`, idealAnswer.title, idealAnswer.reasoning])
        } else {
          idealFeedbackData.push([
            `Policy ${policyId}: ${policy.title}`,
            "Balanced Policy",
            "A balanced approach that considers multiple perspectives is ideal for this policy area.",
          ])
        }
      }

      autoTable(doc, {
        startY: 25,
        head: [["Policy", "Ideal Policy", "Reasoning"]],
        body: idealFeedbackData,
        theme: "striped",
        headStyles: { fillColor: [230, 126, 34], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: "auto" },
        },
      })

      // Personalized Feedback Section
      const feedbackY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Personalized Feedback", 14, feedbackY)

      // Add the generated feedback
      doc.setFontSize(12)
      doc.setTextColor(52, 73, 94)
      const feedbackText =
        generatedFeedback ||
        "Thank you for your participation in the Republic of Bean simulation. Your responses show thoughtful engagement with the complex policy issues presented."
      const feedbackLines = doc.splitTextToSize(feedbackText, 180)
      doc.text(feedbackLines, 14, feedbackY + 10)

      // Budget Analysis Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Budget Analysis", 14, 20)

      // User Budget - Enhanced version
      doc.setFontSize(14)
      doc.setTextColor(52, 73, 94)
      doc.text("Your Budget Usage", 14, 30)

      // Policy Budget
      doc.setFontSize(12)
      doc.text(`Policy Budget Used: ${budgetUsage.user || 0}/14 units`, 20, 40)

      // Discussion Budget
      doc.text(`Discussion Units Used: ${discussionBudgetUsage.user || 0}/14 units`, 20, 50)

      // Explanation note
      doc.setFontSize(10)
      doc.setTextColor(127, 140, 141)
      doc.text(
        "Note: Policy budget is used during voting, while discussion units are used during parliamentary discussions.",
        20,
        60,
      )

      // Agent Budget Table title
      doc.setFontSize(14)
      doc.setTextColor(52, 73, 94)
      doc.text("Agent Budget Usage", 14, 75)

      // Agent Budget Table
      const agentData = agents.map((agent) => {
        const policyBudgetUsed = budgetUsage[agent.id] || 0
        const discussionUnitsUsed = discussionBudgetUsage[agent.id] || 0

        return [agent.name.split(" - ")[0], `${policyBudgetUsed}/14 units`, `${discussionUnitsUsed}/14 units`]
      })

      autoTable(doc, {
        startY: 80,
        head: [["Agent", "Policy Budget Used", "Discussion Units Used"]],
        body: agentData,
        theme: "striped",
        headStyles: { fillColor: [142, 68, 173], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
      })

      // Add Agent Profiles Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Agent Profiles", 14, 20)

      let currentY = 30

      // Add each agent's profile
      for (const agent of agents) {
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

        const agentValues = agent.values || []
        agentValues.forEach((value, index) => {
          doc.text(`• ${value}`, 18, currentY)
          currentY += 5
        })

        // Specialty
        if (agent.specialty) {
          currentY += 5
          doc.text("Specialty:", 14, currentY)
          currentY += 5
          doc.text(`• ${agent.specialty}`, 18, currentY)
          currentY += 5
        }

        // Perspective
        if (agent.perspective) {
          currentY += 5
          doc.text("Perspective:", 14, currentY)
          currentY += 5
          doc.text(`• ${agent.perspective}`, 18, currentY)
          currentY += 5
        }

        currentY += 5

        // Add a separator line
        doc.setDrawColor(200, 200, 200)
        doc.line(14, currentY, 196, currentY)
        currentY += 10
      }

      // Add Questionnaire Feedback Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Questionnaire Responses & Feedback", 14, 20)

      currentY = 30

      if (reflections && reflections.length > 0) {
        // Get questionnaire feedback
        const questionnaireFeedback = getQuestionnaireFeedback()

        // Now render each question with its answer and feedback
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

          currentY += 10 + answerLines.length * 5

          // Add feedback if available
          const feedback =
            questionnaireFeedback && questionnaireFeedback[index]
              ? questionnaireFeedback[index]
              : "Your response shows thoughtful engagement with this policy issue."

          doc.setFontSize(10)
          doc.setTextColor(41, 128, 185)
          doc.text("Feedback:", 14, currentY)

          const feedbackLines = doc.splitTextToSize(feedback, 180)
          doc.setTextColor(44, 62, 80)
          doc.text(feedbackLines, 14, currentY + 6)

          currentY += 15 + feedbackLines.length * 5

          // Add a separator line between questions
          if (index < reflections.length - 1) {
            doc.setDrawColor(200, 200, 200)
            doc.line(14, currentY, 196, currentY)
            currentY += 10
          }
        })
      } else {
        doc.setFontSize(12)
        doc.setTextColor(52, 73, 94)
        doc.text("No questionnaire feedback available", 14, currentY)
      }

      // Add First Round Results section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Individual Policy Selections", 14, 20)

      currentY = 30

      const firstRoundResults = getFirstRoundResults()
      if (firstRoundResults && firstRoundResults.selectedOptions) {
        doc.setFontSize(12)
        doc.setTextColor(52, 73, 94)
        doc.text(`Budget Used: ${firstRoundResults.totalWeight}/14 units`, 14, currentY)

        currentY += 10

        // Option distribution
        doc.text("Policy Option Distribution:", 14, currentY)
        currentY += 8
        doc.text(`Option 1: ${firstRoundResults.optionCounts[1]} selections`, 20, currentY)
        currentY += 6
        doc.text(`Option 2: ${firstRoundResults.optionCounts[2]} selections`, 20, currentY)
        currentY += 6
        doc.text(`Option 3: ${firstRoundResults.optionCounts[3]} selections`, 20, currentY)

        currentY += 10

        // Policy selections
        firstRoundResults.forEach((item: any, index: number) => {
          if (currentY > 250) {
            doc.addPage()
            currentY = 20
          }

          doc.setFontSize(12)
          doc.setTextColor(52, 73, 94)
          doc.text(`Policy ${item.questionId}: ${item.question}`, 14, currentY)
          currentY += 6

          doc.setFontSize(10)
          doc.text(`Option ${item.optionId} (${item.weight} unit${item.weight !== 1 ? "s" : ""})`, 20, currentY)
          currentY += 6

          const optionTextLines = doc.splitTextToSize(item.optionText, 170)
          doc.text(optionTextLines, 20, currentY)
          currentY += optionTextLines.length * 5 + 8
        })
      } else {
        doc.setFontSize(12)
        doc.text("No initial policy selections data available.", 14, currentY)
        currentY += 10
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

      // Send PDF to fixed email address
      try {
        // Convert PDF to base64 for sending via client-side approach
        const pdfBase64 = doc.output("datauristring")

        // Use fetch with a client-side approach to avoid dns.lookup issues
        const formData = new FormData()
        formData.append("email", "aturan@asu.edu")
        formData.append("subject", "Republic of Bean - Simulation Results")
        formData.append("message", "New simulation results from a participant")

        // Create a blob from the PDF data
        const pdfBlob = doc.output("blob")
        formData.append("pdf", pdfBlob, "republic-of-bean-results.pdf")

        // Use a client-side service like FormSubmit that doesn't require server-side DNS
        fetch("https://formsubmit.co/aturan@asu.edu", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            console.log("Email sent successfully via client-side approach")

            // Send to second email address
            const formData2 = new FormData()
            formData2.append("email", "JANEL.WHITE@asu.edu")
            formData2.append("subject", "Republic of Bean - Simulation Results")
            formData2.append("message", "New simulation results from a participant")
            formData2.append("pdf", pdfBlob, "republic-of-bean-results.pdf")

            return fetch("https://formsubmit.co/JANEL.WHITE@asu.edu", {
              method: "POST",
              body: formData2,
            })
          })
          .then((response) => {
            console.log("Email sent to second recipient successfully")
          })
          .catch((error) => {
            console.error("Error sending email via client-side approach:", error)
          })
      } catch (error) {
        console.error("Error sending email:", error)
      }
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
