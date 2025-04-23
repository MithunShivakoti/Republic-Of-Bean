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
import { idealAnswers } from "@/data/ideal-answers"
import { Button } from "@/components/ui/button"

// Map policy IDs to idealAnswers keys
const policyTypeMap = {
  1: "healthcare", // Access to Education
  2: "education", // Language Instruction
  3: "economy", // Teacher Training
  4: "environment", // Curriculum Adaptation
  5: "immigration", // Psychosocial Support
  6: "security", // Financial Support
  7: "infrastructure", // Certification/Accreditation
}

// Add this function to store feedback in localStorage
function storeFeedback(feedback: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("finalFeedback", JSON.stringify({ feedback }))
  }
}

// Add this function to get majority vote results
function getMajorityVoteResults() {
  if (typeof window !== "undefined") {
    const results = localStorage.getItem("beanMajorityOptions")
    return results ? JSON.parse(results) : {}
  }
  return {}
}

// Add this function to retrieve first round results after the getMajorityVoteResults function:
function getFirstRoundResults() {
  if (typeof window !== "undefined") {
    const results = localStorage.getItem("beanFirstRoundResults")
    return results ? JSON.parse(results) : null
  }
  return {}
}

// Add this function to get questionnaire answers
function getQuestionnaireAnswers() {
  if (typeof window !== "undefined") {
    const answers = localStorage.getItem("beanReflectionAnswers")
    return answers ? JSON.parse(answers) : []
  }
  return []
}

// Hardcoded feedback responses based on common questionnaire themes
const feedbackResponses = {
  default:
    "Your participation in the Republic of Bean simulation demonstrates thoughtful engagement with complex policy issues. You've shown an understanding of the trade-offs involved in governance decisions and reflected on how different perspectives shape policy outcomes. The simulation appears to have helped you appreciate the complexity of democratic processes and the importance of considering multiple viewpoints when addressing societal challenges.",

  budgetFocus:
    "Your responses show a strong appreciation for fiscal responsibility and budget constraints in policy-making. You've demonstrated how limited resources require careful prioritization and trade-offs between competing policy goals. This pragmatic approach reflects real-world governance challenges where ideal solutions must often be balanced against practical limitations.",

  socialJustice:
    "Your questionnaire responses emphasize the importance of equity and social justice in policy decisions. You've thoughtfully considered how policies affect different segments of society, particularly vulnerable populations. This perspective highlights the ethical dimensions of governance and the need to ensure that policy benefits are distributed fairly across all citizens.",

  innovation:
    "Your feedback reveals an interest in innovative and forward-thinking policy approaches. You've shown how creative solutions can sometimes transcend traditional policy limitations and address complex problems in novel ways. This innovative mindset is essential for tackling emerging challenges that may not respond to conventional policy tools.",

  consensus:
    "Your responses highlight the value of consensus-building and collaborative decision-making. You've recognized how bringing diverse perspectives together can lead to more robust and widely accepted policies. This appreciation for deliberative processes reflects the core principles of democratic governance in addressing complex societal issues.",
}

// Update the generateIdealPolicyExplanations function to correctly handle idealAnswers as an object
function generateIdealPolicyExplanations() {
  const explanations: { [key: string]: string } = {}

  // For each policy ID (1-7), get the corresponding ideal answer
  for (let policyId = 1; policyId <= 7; policyId++) {
    const policyType = policyTypeMap[policyId as keyof typeof policyTypeMap]
    const policy = policyQuestions.find((p) => p.id === policyId)

    if (idealAnswers[policyType] && policy) {
      // Create a custom explanation that references the specific policy
      explanations[policyId.toString()] = `${idealAnswers[policyType].reasoning}`
    } else {
      // Fallback for policy types that don't have ideal answers defined
      explanations[policyId.toString()] =
        `The ideal policy for this area balances different perspectives and provides sustainable long-term benefits for all citizens of the Republic of Bean.`
    }
  }

  return explanations
}

// Function to generate feedback using OpenAI or fallback to pre-written responses
async function generateFeedbackFromAnswers(answers: any[]) {
  if (!answers || answers.length === 0) {
    return feedbackResponses.default
  }

  try {
    // First try to get a personalized response from the API
    const prompt = `
      Based on the following questionnaire responses from a participant in the Republic of Bean simulation, 
      provide a thoughtful, personalized paragraph of feedback that summarizes their experience, 
      highlights key insights, and offers constructive observations about their participation:
      
      ${answers
        .map(
          (item, index) => `
        Question ${index + 1}: ${item.text}
        Answer: ${item.answer}
      `,
        )
        .join("\n\n")}
    `

    const response = await fetch("/api/generate-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate feedback")
    }

    const data = await response.json()
    return data.feedback || selectFallbackFeedback(answers)
  } catch (error) {
    console.error("Error generating feedback:", error)
    // If API call fails, use our fallback system
    return selectFallbackFeedback(answers)
  }
}

// Helper function to select appropriate fallback feedback based on answers
function selectFallbackFeedback(answers: any[]): string {
  // Default feedback if we can't analyze the answers
  if (!answers || answers.length === 0) return feedbackResponses.default

  // Simple keyword analysis to select appropriate feedback
  const allAnswersText = answers.map((a) => a.answer.toLowerCase()).join(" ")

  if (
    allAnswersText.includes("budget") ||
    allAnswersText.includes("cost") ||
    allAnswersText.includes("expense") ||
    allAnswersText.includes("fund")
  ) {
    return feedbackResponses.budgetFocus
  }

  if (
    allAnswersText.includes("equity") ||
    allAnswersText.includes("justice") ||
    allAnswersText.includes("fair") ||
    allAnswersText.includes("equal")
  ) {
    return feedbackResponses.socialJustice
  }

  if (
    allAnswersText.includes("innovate") ||
    allAnswersText.includes("creative") ||
    allAnswersText.includes("new approach") ||
    allAnswersText.includes("novel")
  ) {
    return feedbackResponses.innovation
  }

  if (
    allAnswersText.includes("consensus") ||
    allAnswersText.includes("collaborate") ||
    allAnswersText.includes("together") ||
    allAnswersText.includes("compromise")
  ) {
    return feedbackResponses.consensus
  }

  // If no specific theme is detected, use the default feedback
  return feedbackResponses.default
}

// Add this function to send email with PDF
async function sendEmailWithPdf(pdfBase64: string, email: string) {
  try {
    const response = await fetch("/api/send-pdf-client/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        subject: "Republic of Bean - Your Simulation Results",
        message: "Thank you for participating in the Republic of Bean simulation. Please find your results attached.",
        pdfBase64,
        fileName: "republic-of-bean-results.pdf",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to send email")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

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
  const [idealPolicyExplanations, setIdealPolicyExplanations] = useState<{ [key: string]: string }>({})
  const [generatedFeedback, setGeneratedFeedback] = useState<string>("")

  // Add this state for email input and sending status
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSendResult, setEmailSendResult] = useState<{ success?: boolean; error?: string } | null>(null)

  // Get the selected options for each policy
  const selectedOptions = policyQuestions.map((question) => {
    // First check user's individual selections from policies context
    const userSelection = policies[question.id]
    const option = question.options.find((opt) => opt.id === userSelection)

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
        const parsedAnswers = JSON.parse(savedAnswers)
        setReflectionAnswers(parsedAnswers)

        // Generate feedback from answers with error handling
        generateFeedbackFromAnswers(parsedAnswers)
          .then((feedback) => {
            setGeneratedFeedback(feedback)
            // Store the feedback in localStorage for future use
            storeFeedback(feedback)
          })
          .catch((error) => {
            console.error("Error generating feedback:", error)
            const fallbackFeedback = selectFallbackFeedback(parsedAnswers)
            setGeneratedFeedback(fallbackFeedback)
            storeFeedback(fallbackFeedback)
          })
      } catch (error) {
        console.error("Error parsing saved reflection answers:", error)
        // Set default feedback if there's an error
        setGeneratedFeedback(feedbackResponses.default)
        storeFeedback(feedbackResponses.default)
      }
    } else {
      // Set default feedback if no answers are found
      setGeneratedFeedback(feedbackResponses.default)
      storeFeedback(feedbackResponses.default)
    }

    // Load policy budget usage from localStorage
    const savedBudgetUsage = localStorage.getItem("beanBudgetUsage")
    if (savedBudgetUsage) {
      try {
        const parsedBudgetUsage = JSON.parse(savedBudgetUsage)
        console.log("Loaded budget usage:", parsedBudgetUsage)
        setBudgetUsage(parsedBudgetUsage)
      } catch (error) {
        console.error("Error parsing saved budget usage:", error)
      }
    }

    // Load discussion budget usage from localStorage
    const savedDiscussionBudget = localStorage.getItem("beanDiscussionBudgetUsage")
    if (savedDiscussionBudget) {
      try {
        const parsedDiscussionBudget = JSON.parse(savedDiscussionBudget)
        console.log("Loaded discussion budget:", parsedDiscussionBudget)
        setDiscussionBudgetUsage(parsedDiscussionBudget)
      } catch (error) {
        console.error("Error parsing saved discussion budget usage:", error)
      }
    }

    // Generate ideal policy explanations for all 7 policy types
    const explanations = generateIdealPolicyExplanations()
    setIdealPolicyExplanations(explanations)

    setIsLoading(false)
  }, [])

  // Function to download PDF directly instead of sending via email
  const downloadPdf = async () => {
    if (emailSent) return // Prevent duplicate downloads

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
      doc.text("Individual Policy Selections", 14, userInfoY)

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

      // Ideal Policy Explanations Section
      const idealPolicyY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Ideal Policy Explanations", 14, idealPolicyY)

      // Create data for ideal policy explanations
      const idealPolicyData = []

      // For each policy ID (1-7), get the corresponding ideal answer
      for (let policyId = 1; policyId <= 7; policyId++) {
        const policyType = policyTypeMap[policyId as keyof typeof policyTypeMap]
        const policy = policyQuestions.find((p) => p.id === policyId)

        if (idealAnswers[policyType] && policy) {
          idealPolicyData.push([
            `Policy ${policyId}: ${policy.title}`,
            idealAnswers[policyType].title,
            idealPolicyExplanations[policyId.toString()] || idealAnswers[policyType].reasoning,
          ])
        }
      }

      autoTable(doc, {
        startY: idealPolicyY + 5,
        head: [["Policy", "Ideal Option", "Explanation"]],
        body: idealPolicyData,
        theme: "striped",
        headStyles: { fillColor: [230, 126, 34], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: "auto" },
        },
      })

      // Questionnaire Feedback Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Questionnaire Responses", 14, 20)

      let currentY = 30

      if (reflectionAnswers && reflectionAnswers.length > 0) {
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
      } else {
        doc.setFontSize(12)
        doc.setTextColor(52, 73, 94)
        doc.text("No questionnaire feedback available", 14, currentY)
      }

      // Personalized Feedback Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Personalized Feedback", 14, 20)

      // Add the generated feedback
      doc.setFontSize(12)
      doc.setTextColor(52, 73, 94)
      const feedbackLines = doc.splitTextToSize(generatedFeedback || feedbackResponses.default, 180)
      doc.text(feedbackLines, 14, 30)

      // Save the PDF
      doc.save("republic-of-bean-results.pdf")
      setEmailSent(true) // Mark as downloaded to prevent duplicate downloads

      console.log("PDF downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating your PDF. Please try again.")
    }
  }

  // Add this function to handle email sending
  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    setEmailSendResult(null)

    try {
      // Generate PDF as base64
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
      doc.text("Individual Policy Selections", 14, userInfoY)

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

      // Ideal Policy Explanations Section
      const idealPolicyY = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Ideal Policy Explanations", 14, idealPolicyY)

      // Create data for ideal policy explanations
      const idealPolicyData = []

      // For each policy ID (1-7), get the corresponding ideal answer
      for (let policyId = 1; policyId <= 7; policyId++) {
        const policyType = policyTypeMap[policyId as keyof typeof policyTypeMap]
        const policy = policyQuestions.find((p) => p.id === policyId)

        if (idealAnswers[policyType] && policy) {
          idealPolicyData.push([
            `Policy ${policyId}: ${policy.title}`,
            idealAnswers[policyType].title,
            idealPolicyExplanations[policyId.toString()] || idealAnswers[policyType].reasoning,
          ])
        }
      }

      autoTable(doc, {
        startY: idealPolicyY + 5,
        head: [["Policy", "Ideal Option", "Explanation"]],
        body: idealPolicyData,
        theme: "striped",
        headStyles: { fillColor: [230, 126, 34], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: "auto" },
        },
      })

      // Questionnaire Feedback Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Questionnaire Responses", 14, 20)

      let currentY = 30

      if (reflectionAnswers && reflectionAnswers.length > 0) {
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
      } else {
        doc.setFontSize(12)
        doc.setTextColor(52, 73, 94)
        doc.text("No questionnaire feedback available", 14, currentY)
      }

      // Personalized Feedback Section
      doc.addPage()
      doc.setFontSize(16)
      doc.setTextColor(41, 128, 185)
      doc.text("Personalized Feedback", 14, 20)

      // Add the generated feedback
      doc.setFontSize(12)
      doc.setTextColor(52, 73, 94)
      const feedbackLines = doc.splitTextToSize(generatedFeedback || feedbackResponses.default, 180)
      doc.text(feedbackLines, 14, 30)

      // Get discussion data from localStorage
      try {
        // Add Discussion Transcripts Section
        doc.addPage()
        doc.setFontSize(16)
        doc.setTextColor(41, 128, 185)
        doc.text("Discussion Transcripts", 14, 20)

        let discussionY = 30

        // Try to get discussion data from localStorage
        const discussionData = {}
        for (let i = 1; i <= 7; i++) {
          const key = `beanDiscussion${i}`
          const data = localStorage.getItem(key)
          if (data) {
            discussionData[i] = JSON.parse(data)
          }
        }

        if (Object.keys(discussionData).length > 0) {
          // For each discussion
          Object.entries(discussionData).forEach(([discussionId, messages]) => {
            // Check if we need a new page
            if (discussionY > 250) {
              doc.addPage()
              discussionY = 20
            }

            const policyQuestion = policyQuestions.find((p) => p.id === Number(discussionId))

            doc.setFontSize(14)
            doc.setTextColor(41, 128, 185)
            doc.text(`Discussion ${discussionId}: ${policyQuestion?.title || "Unknown Policy"}`, 14, discussionY)

            discussionY += 10

            // Add each message
            if (Array.isArray(messages)) {
              messages.forEach((msg: any) => {
                // Check if we need a new page
                if (discussionY > 270) {
                  doc.addPage()
                  discussionY = 20
                }

                const sender = msg.role === "user" ? "You" : msg.sender || "Agent"

                doc.setFontSize(10)
                doc.setTextColor(46, 204, 113)
                doc.text(`${sender}:`, 14, discussionY)

                doc.setFontSize(9)
                doc.setTextColor(52, 73, 94)
                const messageLines = doc.splitTextToSize(msg.content || "", 180)
                doc.text(messageLines, 14, discussionY + 5)

                discussionY += 10 + messageLines.length * 4
              })
            }

            discussionY += 15
          })
        } else {
          doc.setFontSize(12)
          doc.setTextColor(52, 73, 94)
          doc.text("No discussion transcripts available", 14, discussionY)
        }
      } catch (error) {
        console.error("Error adding discussion transcripts to PDF:", error)
        // Continue with PDF generation even if discussion data fails
      }

      // Instead of doc.save(), use output to get base64
      const pdfBase64 = doc.output("datauristring")

      // Send email with PDF
      const result = await fetch("/api/send-pdf-client/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "aturan@asu.edu",
          subject: "Republic of Bean - Your Simulation Results",
          message: "Thank you for participating in the Republic of Bean simulation. Please find your results attached.",
          pdfBase64,
          fileName: "republic-of-bean-results.pdf",
        }),
      })

      if (!result.ok) {
        throw new Error("Failed to send email through client route")
      }

      // Send to second email address
      const result2 = await fetch("/api/send-pdf-client/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "JANEL.WHITE@asu.edu",
          subject: "Republic of Bean - Your Simulation Results",
          message: "Thank you for participating in the Republic of Bean simulation. Please find your results attached.",
          pdfBase64,
          fileName: "republic-of-bean-results.pdf",
        }),
      })

      if (!result2.ok) {
        console.error("Failed to send email to second recipient")
      }

      setEmailSendResult({ success: true })
    } catch (error) {
      console.error("Error sending email:", error)
      setEmailSendResult({ error: "Failed to send email. Please try downloading instead." })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Call the function to silently generate and send PDF when component mounts
  useEffect(() => {
    if (!isLoading && !emailSent) {
      // Instead of trying to send email, just download the PDF
      // downloadPdf()
      // We'll let the user click the button instead of doing it automatically
    }
  }, [isLoading, emailSent])

  // Add this before the return statement
  const majorityVoteResults = getMajorityVoteResults()
  // Add this line before the return statement, after the majorityVoteResults constant:
  const firstRoundResults = getFirstRoundResults()
  // Get questionnaire answers
  const questionnaireAnswers = getQuestionnaireAnswers()

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
          {/* Generated Feedback */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Personalized Feedback</h2>
            </CardHeader>
            <CardContent className="p-4 dark-card">
              {generatedFeedback ? (
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
                  <p className="text-white leading-relaxed">{generatedFeedback}</p>
                </div>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="ml-3 text-white">Generating feedback...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Majority Vote Results */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Parliamentary Voting Results</h2>
            </CardHeader>
            <CardContent className="p-4 dark-card">
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
            </CardContent>
          </Card>

          {/* Ideal Policy Explanations */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Ideal Policy Explanations</h2>
            </CardHeader>
            <CardContent className="p-4 dark-card">
              <div className="grid gap-4">
                {Object.keys(idealPolicyExplanations).length > 0 ? (
                  Object.entries(idealPolicyExplanations).map(([policyId, explanation]) => {
                    const policyQuestion = policyQuestions.find((q) => q.id === Number.parseInt(policyId))
                    const policyIdNum = Number.parseInt(policyId)
                    const policyType = policyTypeMap[policyIdNum as keyof typeof policyTypeMap]
                    const idealTitle = policyType && idealAnswers[policyType] ? idealAnswers[policyType].title : ""

                    return (
                      <div
                        key={policyId}
                        className="p-4 rounded-lg bg-gradient-to-r from-orange-600/10 to-yellow-600/10 border border-orange-600/30"
                      >
                        <p className="font-semibold neon-text">
                          Policy {policyId}: {policyQuestion?.title}
                        </p>
                        <p className="text-yellow-400 text-sm">Ideal Policy: {idealTitle}</p>
                        <p className="text-gray-300 mt-2">{explanation}</p>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-white">No ideal policy explanations available.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* First Round Results */}
          {firstRoundResults && (
            <Card className="shadow-lg overflow-hidden glow-card dark-card">
              <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold neon-text">Your Initial Policy Selections</h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full shadow-sm">
                    <span className="text-gray-100">
                      Budget Used:{" "}
                      <span className="font-bold text-primary neon-text-primary">{firstRoundResults.totalWeight}</span>
                      /14 units
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 dark-card">
                {/* Option distribution summary */}
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <h3 className="text-lg font-medium mb-3 neon-text">Policy Option Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-400">{firstRoundResults.optionCounts[1]}</div>
                      <div className="text-sm text-gray-300">Option 1 selections</div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-600/30 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400">{firstRoundResults.optionCounts[2]}</div>
                      <div className="text-sm text-gray-300">Option 2 selections</div>
                    </div>
                    <div className="bg-orange-900/20 border border-orange-600/30 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-400">{firstRoundResults.optionCounts[3]}</div>
                      <div className="text-sm text-gray-300">Option 3 selections</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
                  {firstRoundResults.selectedOptions &&
                    firstRoundResults.selectedOptions.map((item: any, index: number) => (
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
                            <div>
                              <p className="font-medium text-gray-100 neon-text">Option {item.optionId}</p>
                              <p className="text-sm text-gray-100 mt-1">{item.optionText}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questionnaire Feedback */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Questionnaire Feedback</h2>
            </CardHeader>
            <CardContent className="p-4 dark-card">
              {questionnaireAnswers && questionnaireAnswers.length > 0 ? (
                <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30">
                  <p className="text-white leading-relaxed">
                    {generatedFeedback ||
                      `Your responses to the Republic of Bean simulation questionnaire demonstrate a thoughtful engagement with complex policy issues. You've shown a nuanced understanding of the trade-offs involved in governance decisions and reflected critically on how different perspectives shape policy outcomes. Your insights about balancing competing interests while maintaining budget constraints highlight the real-world challenges of policymaking. The simulation appears to have helped you appreciate the complexity of democratic processes and the importance of considering multiple viewpoints when addressing societal challenges. Your participation reflects an appreciation for deliberative democracy and the value of collaborative decision-making in addressing complex social problems.`}
                  </p>
                </div>
              ) : (
                <p className="text-white text-center py-4">No questionnaire feedback available.</p>
              )}
            </CardContent>
          </Card>

          {/* Budget Analysis */}
          <Card className="shadow-lg overflow-hidden glow-card dark-card">
            <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text">Budget Analysis</h2>
            </CardHeader>
            <CardContent className="p-4 dark-card">
              <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <h3 className="text-lg font-medium mb-3 neon-text">Your Budget Usage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-900/20 border border-purple-600/30 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Policy Budget Used:</span>
                      <span className="font-bold text-primary">{budgetUsage.user || 0}/14 units</span>
                    </div>
                    <div className="w-full bg-gray-700/50 h-2 mt-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        style={{ width: `${((budgetUsage.user || 0) / 14) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-600/30 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Discussion Units Used:</span>
                      <span className="font-bold text-blue-400">{discussionBudgetUsage.user || 0}/14 units</span>
                    </div>
                    <div className="w-full bg-gray-700/50 h-2 mt-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${((discussionBudgetUsage.user || 0) / 14) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mt-3">
                  <span className="text-yellow-400">Note:</span> Policy budget is used when you select options in the
                  voting phase. Discussion units are used during the parliamentary discussion phase.
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-3 neon-text">Agent Budget Usage</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Agents vote independently during each policy discussion. Their budget usage may appear similar
                  because:
                  <br />
                  1. They follow similar voting patterns based on their profiles
                  <br />
                  2. Budget constraints may force them to choose similar options
                  <br />
                  3. The majority voting system influences their final selections
                </p>
              </div>

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

                      return (
                        <tr key={agent.id} className="border-b border-primary/20">
                          <td className="py-2 px-4">{agent.name.split(" - ")[0]}</td>
                          <td className="py-2 px-4">{policyBudgetUsed}/14 units</td>
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
          <div className="flex justify-center mt-4 gap-4">
            <PDFExport
              policies={selectedOptions}
              reflections={reflectionAnswers}
              budgetUsage={budgetUsage}
              discussionBudgetUsage={discussionBudgetUsage}
              agents={agents}
              parliamentaryDecisions={parliamentaryDecisions}
              idealPolicyExplanations={idealPolicyExplanations}
              generatedFeedback={generatedFeedback}
            />
            <div className="flex flex-col items-center mt-4 w-full max-w-md mx-auto">
              <Button onClick={handleSendEmail} disabled={isSendingEmail} className="neon-button-primary">
                {isSendingEmail ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>Email Results</>
                )}
              </Button>
              {emailSendResult?.success && <p className="text-green-500 text-sm mt-2">Email sent successfully!</p>}
              {emailSendResult?.error && <p className="text-red-500 text-sm mt-2">{emailSendResult.error}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
