import { NextResponse } from "next/server"

// OpenAI API configuration
const OPENAI_API_KEY =
  "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"
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_MODEL = "gpt-4o-mini"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, userSelections, idealSelections, reflectionAnswers } = body

    let prompt = ""
    if (type === "comparison") {
      prompt = `
You are an educational policy expert analyzing a user's choices in a refugee education policy simulation.

The user made the following policy choices:
${userSelections.map((selection: any) => `- ${selection.policy}: ${selection.userChoice}`).join("\n")}

The ideal policy choices based on research and best practices are:
${idealSelections.map((selection: any) => `- ${selection.policy}: ${selection.idealChoice}`).join("\n")}

Please provide a concise paragraph (maximum 250 words) comparing the user's choices with the ideal choices. 
Explain where they differed and why the ideal choices might lead to better outcomes for refugee education.
Focus on the educational impact, not just budget considerations.
Be constructive but honest about any shortcomings in the user's approach.
`
    } else if (type === "questionnaire") {
      prompt = `
You are an educational policy expert analyzing a user's reflections after participating in a refugee education policy simulation.

The user provided the following reflections:
${reflectionAnswers
  ?.map(
    (reflection: any, index: number) =>
      `Question ${index + 1}: ${reflection.text}\nUser's Answer: ${reflection.answer}`,
  )
  .join("\n\n")}

Please provide thoughtful feedback (maximum 250 words) on the user's reflections. 
Analyze their understanding of refugee education policy complexities, power dynamics, and ethical considerations.
Highlight strengths in their thinking and areas where they could develop more critical consciousness.
Suggest how they might deepen their analysis of educational policies in relation to broader systems of inclusion/exclusion.
Be constructive, encouraging, and specific in your feedback.
`
    } else {
      return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 })
    }

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
              "You are an educational policy expert providing feedback on refugee education policy decisions and reflections.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenAI API error:", errorData)
      return NextResponse.json({ error: "Error generating feedback" }, { status: 500 })
    }

    const data = await response.json()
    const feedback = data.choices[0].message.content.trim()

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("Error in generate-feedback route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
