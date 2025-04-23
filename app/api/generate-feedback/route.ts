import { NextResponse } from "next/server"

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_MODEL = "gpt-4o-mini"

// Fallback feedback responses
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

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if API key is available
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key is not set")
      // Return a fallback response
      return NextResponse.json({
        feedback: feedbackResponses.default,
      })
    }

    try {
      // Call OpenAI API
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant providing personalized feedback on a user's participation in a policy simulation. Provide thoughtful, constructive feedback in a single paragraph.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json({
        feedback: data.choices[0].message.content.trim(),
      })
    } catch (error) {
      console.error("Error calling OpenAI API:", error)

      // Analyze the prompt to select appropriate fallback feedback
      const promptLower = prompt.toLowerCase()

      if (
        promptLower.includes("budget") ||
        promptLower.includes("cost") ||
        promptLower.includes("expense") ||
        promptLower.includes("fund")
      ) {
        return NextResponse.json({ feedback: feedbackResponses.budgetFocus })
      }

      if (
        promptLower.includes("equity") ||
        promptLower.includes("justice") ||
        promptLower.includes("fair") ||
        promptLower.includes("equal")
      ) {
        return NextResponse.json({ feedback: feedbackResponses.socialJustice })
      }

      if (
        promptLower.includes("innovate") ||
        promptLower.includes("creative") ||
        promptLower.includes("new approach") ||
        promptLower.includes("novel")
      ) {
        return NextResponse.json({ feedback: feedbackResponses.innovation })
      }

      if (
        promptLower.includes("consensus") ||
        promptLower.includes("collaborate") ||
        promptLower.includes("together") ||
        promptLower.includes("compromise")
      ) {
        return NextResponse.json({ feedback: feedbackResponses.consensus })
      }

      return NextResponse.json({ feedback: feedbackResponses.default })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 })
  }
}
