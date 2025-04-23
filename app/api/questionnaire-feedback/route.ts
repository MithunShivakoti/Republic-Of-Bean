import { NextResponse } from "next/server"

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_MODEL = "gpt-4o-mini"

// Fallback feedback responses
const feedbackResponses = {
  default:
    "Your response shows thoughtful engagement with this aspect of refugee education policy. You've demonstrated an understanding of the complex trade-offs involved in governance decisions.",

  budgetFocus:
    "Your answer reflects a pragmatic consideration of resource constraints and budget limitations. This practical approach acknowledges the real-world challenges of implementing policy with finite resources.",

  socialJustice:
    "Your response emphasizes equity and social justice considerations. You've thoughtfully considered how this policy affects vulnerable populations and highlighted the ethical dimensions of governance.",

  innovation:
    "Your answer reveals an interest in innovative approaches to policy challenges. You've shown how creative solutions can sometimes transcend traditional policy limitations.",

  consensus:
    "Your response values consensus-building and collaborative decision-making. You recognize how bringing diverse perspectives together can lead to more robust and widely accepted policies.",
}

export async function POST(request: Request) {
  try {
    const { question, answer } = await request.json()

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 })
    }

    // Check if API key is available
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key is not set")
      // Return a fallback response
      return NextResponse.json({
        feedback: selectFallbackFeedback(answer),
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
                "You are an AI assistant providing personalized feedback on a user's response to a question about refugee education policy. Provide thoughtful, constructive feedback in 2-3 sentences.",
            },
            {
              role: "user",
              content: `Question: ${question}\n\nUser's Answer: ${answer}\n\nPlease provide constructive feedback on this response.`,
            },
          ],
          max_tokens: 150,
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
      return NextResponse.json({ feedback: selectFallbackFeedback(answer) })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 })
  }
}

// Helper function to select appropriate fallback feedback based on answer
function selectFallbackFeedback(answer: string): string {
  // Default feedback if we can't analyze the answer
  if (!answer) return feedbackResponses.default

  // Simple keyword analysis to select appropriate feedback
  const answerText = answer.toLowerCase()

  if (
    answerText.includes("budget") ||
    answerText.includes("cost") ||
    answerText.includes("expense") ||
    answerText.includes("fund")
  ) {
    return feedbackResponses.budgetFocus
  }

  if (
    answerText.includes("equity") ||
    answerText.includes("justice") ||
    answerText.includes("fair") ||
    answerText.includes("equal")
  ) {
    return feedbackResponses.socialJustice
  }

  if (
    answerText.includes("innovate") ||
    answerText.includes("creative") ||
    answerText.includes("new approach") ||
    answerText.includes("novel")
  ) {
    return feedbackResponses.innovation
  }

  if (
    answerText.includes("consensus") ||
    answerText.includes("collaborate") ||
    answerText.includes("together") ||
    answerText.includes("compromise")
  ) {
    return feedbackResponses.consensus
  }

  // If no specific theme is detected, use the default feedback
  return feedbackResponses.default
}
