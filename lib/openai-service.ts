import { policyQuestions } from "@/data/policy-questions"
import allAgentProfiles from "@/data/all-agent-profiles"
import allExtendedAgentProfiles from "@/data/all-agent-profiles-extended"

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_MODEL = "gpt-4o-mini"

// Helper function to check if API key is available
function checkApiKey() {
  if (!OPENAI_API_KEY) {
    console.error("OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable.")
    return false
  }
  return true
}

// Helper function to get agent profiles
function getAgentProfiles(agentId: string) {
  // First try to get from session storage (dynamically selected agents)
  if (typeof window !== "undefined") {
    try {
      const savedAgents = sessionStorage.getItem("beanSelectedAgents")
      if (savedAgents) {
        const selectedAgents = JSON.parse(savedAgents)
        const agent = selectedAgents.find((a: any) => a.id === agentId)
        if (agent) {
          const extendedProfile = allExtendedAgentProfiles.find((p) => p.id === agentId)
          return { agent, extendedProfile }
        }
      }
    } catch (error) {
      console.error("Error parsing saved agents:", error)
    }
  }

  // Fallback to all agents if not found in session storage
  const agent = allAgentProfiles.find((a) => a.id === agentId)
  const extendedProfile = allExtendedAgentProfiles.find((p) => p.id === agentId)

  return { agent, extendedProfile }
}

// Function to get agent response from OpenAI
export async function getAgentResponse(agentId: string, policyId: number, timestamp?: number): Promise<string> {
  try {
    // Check if API key is available
    if (!checkApiKey()) {
      return getFallbackResponse(agentId, policyId)
    }

    const { agent, extendedProfile } = getAgentProfiles(agentId)
    const policy = policyQuestions.find((p) => p.id === policyId)

    if (!agent || !policy || !extendedProfile) {
      throw new Error("Agent or policy not found")
    }

    // Create a detailed prompt for the agent
    const prompt = `
You are ${agent.name}, ${agent.role}, speaking in a parliamentary discussion about refugee education policy in the fictional country of Republic of Bean.

Your background:
${agent.background}

Your core values:
${extendedProfile.values.join(", ")}

Your approach:
${extendedProfile.approach}

Your areas of expertise:
${extendedProfile.expertise.join(", ")}

Your perspective is characterized as: ${agent.perspective}
Your specialty is: ${agent.specialty || "General refugee education policy"}

The current policy being discussed is: "${policy.title}"
Description: ${policy.description}

The policy options are:
${policy.options.map((opt) => `Option ${opt.id} (${opt.weight} unit${opt.weight !== 1 ? "s" : ""}): ${opt.text}`).join("\n")}

IMPORTANT INSTRUCTION: You should consider ALL policy options equally, regardless of their unit cost. Do not be overly concerned about budget constraints. There should be an equal probability of you supporting option 1, option 2, or option 3. Your response should be based on your character's values and perspective, not on trying to save budget units.

Based on your character, background, values, and expertise, provide a thoughtful response about this policy issue in EXACTLY ONE SENTENCE.
IMPORTANT: DO NOT explicitly mention which option number you support. Instead, express your opinion in a way that indirectly aligns with one of the options.
For example, instead of saying "I support Option 2", say something like "A balanced approach that considers both cultural preservation and integration would best serve refugee students."

Speak in first person as if you are addressing other parliament members. Be concise but persuasive.
Your response should reflect your unique perspective and priorities.

IMPORTANT: Make your response unique and different from previous responses you may have given. Add a timestamp: ${timestamp || Date.now()} to ensure uniqueness.
`

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
                "You are an AI assistant generating in-character responses for a parliamentary simulation. Respond with EXACTLY ONE SENTENCE that indirectly aligns with one of the policy options without explicitly mentioning option numbers.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.8,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API error:", errorData)
        return getFallbackResponse(agentId, policyId)
      }

      const data = await response.json()
      // Remove any timestamp that might have been included in the response
      let content = data.choices[0].message.content.trim()
      content = content.replace(/\d{13,}/, "") // Remove any 13+ digit numbers (timestamps)
      return content
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      return getFallbackResponse(agentId, policyId)
    }
  } catch (error) {
    console.error("Error getting agent response:", error)
    return getFallbackResponse(agentId, policyId)
  }
}

// Function to get agent preferred option from OpenAI
export async function getAgentPreferredOption(agentId: string, policyId: number): Promise<number> {
  try {
    // Check if API key is available
    if (!checkApiKey()) {
      return getDefaultPreferredOption(agentId, policyId)
    }

    const { agent, extendedProfile } = getAgentProfiles(agentId)
    const policy = policyQuestions.find((p) => p.id === policyId)

    if (!agent || !policy || !extendedProfile) {
      throw new Error("Agent or policy not found")
    }

    // Create a detailed prompt for the agent
    const prompt = `
You are ${agent.name}, ${agent.role}, speaking in a parliamentary discussion about refugee education policy in the fictional country of Republic of Bean.

Your background:
${agent.background}

Your core values:
${extendedProfile.values.join(", ")}

Your approach:
${extendedProfile.approach}

Your areas of expertise:
${extendedProfile.expertise.join(", ")}

Your perspective is characterized as: ${agent.perspective}
Your specialty is: ${agent.specialty || "General refugee education policy"}

The current policy being discussed is: "${policy.title}"
Description: ${policy.description}

The policy options are:
${policy.options.map((opt) => `Option ${opt.id} (${opt.weight} unit${opt.weight !== 1 ? "s" : ""}): ${opt.text}`).join("\n")}

Based on your character, background, values, and expertise, which policy option would you prefer? Respond with ONLY the option number (1, 2, or 3).
`

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
                "You are an AI assistant generating in-character responses for a parliamentary simulation. Respond with ONLY the option number (1, 2, or 3).",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 5,
          temperature: 0.2,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API error:", errorData)
        return getDefaultPreferredOption(agentId, policyId)
      }

      const data = await response.json()
      const content = data.choices[0].message.content.trim()
      const optionNumber = Number.parseInt(content)

      if (isNaN(optionNumber) || optionNumber < 1 || optionNumber > 3) {
        console.warn("Invalid option number from OpenAI:", content)
        return getDefaultPreferredOption(agentId, policyId)
      }

      return optionNumber
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      return getDefaultPreferredOption(agentId, policyId)
    }
  } catch (error) {
    console.error("Error getting agent preferred option:", error)
    return getDefaultPreferredOption(agentId, policyId)
  }
}

// Function to get agent response to user from OpenAI
export async function getAgentResponseToUser(
  agentId: string,
  userMessage: string,
  policyId: number,
  conversationHistory: string,
): Promise<string> {
  try {
    // Check if API key is available
    if (!checkApiKey()) {
      return getFallbackResponse(agentId, policyId)
    }

    const { agent, extendedProfile } = getAgentProfiles(agentId)
    const policy = policyQuestions.find((p) => p.id === policyId)

    if (!agent || !policy || !extendedProfile) {
      throw new Error("Agent or policy not found")
    }

    // Create a detailed prompt for the agent
    const prompt = `
You are ${agent.name}, ${agent.role}, speaking in a parliamentary discussion about refugee education policy in the fictional country of Republic of Bean.

Your background:
${agent.background}

Your core values:
${extendedProfile.values.join(", ")}

Your approach:
${extendedProfile.approach}

Your areas of expertise:
${extendedProfile.expertise.join(", ")}

Your perspective is characterized as: ${agent.perspective}
Your specialty is: ${agent.specialty || "General refugee education policy"}

The current policy being discussed is: "${policy.title}"
Description: ${policy.description}

The policy options are:
${policy.options.map((opt) => `Option ${opt.id} (${opt.weight} unit${opt.weight !== 1 ? "s" : ""}): ${opt.text}`).join("\n")}

Here is the current conversation history:
${conversationHistory}

A user has just said: "${userMessage}"

Based on your character, background, values, and expertise, how would you respond to the user? Respond in EXACTLY ONE SENTENCE.
`

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
                "You are an AI assistant generating in-character responses for a parliamentary simulation. Respond with EXACTLY ONE SENTENCE.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API error:", errorData)
        return getFallbackResponse(agentId, policyId)
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      return getFallbackResponse(agentId, policyId)
    }
  } catch (error) {
    console.error("Error getting agent response:", error)
    return getFallbackResponse(agentId, policyId)
  }
}

// Add this function to analyze agent opinions and find the mode
export async function analyzeAgentOpinions(
  agents: any[],
  messages: any[],
  policy: any,
): Promise<{ mode: string; analysis: string }> {
  try {
    // Check if API key is available
    if (!checkApiKey()) {
      return {
        mode: "2", // Default to option 2
        analysis: "Unable to analyze opinions due to missing API key.",
      }
    }

    // Extract the latest opinion from each agent
    const latestOpinions: Record<string, string> = {}

    // Go through messages in reverse to find the latest opinion for each agent
    for (const message of [...messages].reverse()) {
      if (message.role === "agent" && message.agentId) {
        if (!latestOpinions[message.agentId]) {
          latestOpinions[message.agentId] = message.content
        }
      }
    }

    // Prepare the prompt for OpenAI
    const prompt = `
    I have a policy discussion about "${policy.title}" with the following agent opinions:
    
    ${Object.entries(latestOpinions)
      .map(([agentId, opinion]) => {
        const agent = agents.find((a) => a.id === agentId)
        return `${agent?.name || "Unknown Agent"}: "${opinion}"`
      })
      .join("\n\n")}
    
    Based on these opinions, please:
    1. Analyze what option (1, 2, or 3) each agent likely supports based on their statements
    2. Determine the most supported option among the agents
    3. Provide a brief summary of the consensus or lack thereof
    
    Format your response as:
    OPTION: [1/2/3]
    ANALYSIS: [your analysis here]
  `

    try {
      // Call OpenAI API
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert political analyst who can determine which policy option (1, 2, or 3) each agent supports based on their statements.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const result = data.choices[0].message.content

      // Extract option and analysis
      const optionMatch = result.match(/OPTION:\s*(1|2|3)/i)
      const analysisMatch = result.match(/ANALYSIS:\s*([\s\S]*)/i)

      return {
        mode: optionMatch ? optionMatch[1] : "2", // Default to option 2 if no match
        analysis: analysisMatch ? analysisMatch[1].trim() : "No clear consensus.",
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      return {
        mode: "2", // Default to option 2
        analysis: "Unable to determine consensus due to an error.",
      }
    }
  } catch (error) {
    console.error("Error analyzing agent opinions:", error)
    return {
      mode: "2", // Default to option 2
      analysis: "Unable to determine consensus due to an error.",
    }
  }
}

// Function to get agent opinion for a specific policy
export async function getAgentOpinion(
  agent: any,
  policy: any,
  conversationHistory = "",
  usedBudget = 0,
  remainingBudget = 14,
): Promise<string> {
  try {
    // Check if API key is available
    if (!checkApiKey()) {
      return "A balanced approach that carefully considers all aspects of this policy is essential to ensure the best outcomes for our citizens."
    }

    // Get extended profile for the agent
    const extendedProfile = allExtendedAgentProfiles.find((p) => p.id === agent.id)

    if (!extendedProfile) {
      throw new Error("Extended profile not found for agent")
    }

    // Create a detailed prompt for the agent with emphasis on varied responses
    const prompt = `
You are ${agent.name}, ${agent.role}, speaking in a parliamentary discussion about refugee education policy in the fictional country of Republic of Bean.

Your background:
${agent.background}

Your core values:
${extendedProfile.values.join(", ")}

Your approach:
${extendedProfile.approach}

Your areas of expertise:
${extendedProfile.expertise.join(", ")}

Your perspective is characterized as: ${agent.perspective}
Your specialty is: ${agent.specialty || "General refugee education policy"}

The current policy being discussed is: "${policy.title}"
Description: ${policy.description}

The policy options are:
${policy.options.map((opt: any) => `Option ${opt.id} (${opt.weight} unit${opt.weight !== 1 ? "s" : ""}): ${opt.text}`).join("\n")}

BUDGET INFORMATION:
- Used budget so far: ${usedBudget} units
- Remaining budget: ${remainingBudget} units
- Total budget: 14 units

${
  conversationHistory
    ? `Previous conversation:
${conversationHistory}
`
    : ""
}

IMPORTANT: Ensure your response reflects your unique character and perspective. Be opinionated and don't be afraid to take a strong stance that aligns with one of the policy options. 

Given your ample remaining budget of ${remainingBudget} units, consider supporting more comprehensive options (Options 2 or 3) if they align with your values, as you have sufficient budget to afford them. Don't be overly conservative with the budget - the parliament needs bold, effective solutions.

Based on your character, background, and expertise, provide a thoughtful response about this policy issue in EXACTLY ONE SENTENCE.
DO NOT explicitly mention which option number you support. Instead, express your opinion in a way that indirectly aligns with one of the policy options.
For example, instead of saying "I support Option 2", say something like "A balanced approach that considers both cultural preservation and integration would best serve refugee students."

Speak in first person as if you are addressing other parliament members. Be concise but persuasive.
Your response should reflect your unique perspective and priorities.
`

    try {
      // Call OpenAI API with higher temperature for more varied responses
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
                "You are an AI assistant generating in-character responses for a parliamentary simulation. Respond with EXACTLY ONE SENTENCE that indirectly aligns with one of the policy options without explicitly mentioning option numbers. Be opinionated and varied in your responses.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.9,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error("Error calling OpenAI API:", error)
      return "A balanced approach that carefully considers all aspects of this policy is essential to ensure the best outcomes for our citizens."
    }
  } catch (error) {
    console.error("Error getting agent opinion:", error)
    return "A balanced approach that carefully considers all aspects of this policy is essential to ensure the best outcomes for our citizens."
  }
}

// Fallback function to get default preferred option
function getDefaultPreferredOption(agentId: string, policyId: number): number {
  const agent = allAgentProfiles.find((a) => a.id === agentId)

  if (!agent) {
    return 2 // Default to option 2 if agent not found
  }

  if (agent.specialty?.includes("Trauma") || agent.perspective.includes("trauma")) {
    return 3 // Trauma-focused agents prefer option 3
  } else if (agent.specialty?.includes("Cultural") || agent.perspective.includes("cultural")) {
    return 2 // Cultural preservation agents prefer option 2
  } else if (agent.specialty?.includes("Inclusion") || agent.perspective.includes("inclusion")) {
    return 3 // Inclusion-focused agents prefer option 3
  } else if (agent.specialty?.includes("Evidence") || agent.perspective.includes("evidence")) {
    return 2 // Evidence-based agents prefer option 2
  } else {
    return 2 // Default to option 2 for other agents
  }
}

// Fallback responses in case the API call fails
function getFallbackResponse(agentId: string, policyId: number): string {
  const policy = policyQuestions.find((p) => p.id === policyId)
  const policyType = policy?.title.toLowerCase() || ""

  // Get agent profile
  const agent = allAgentProfiles.find((a) => a.id === agentId)

  if (!agent) {
    return "A balanced approach that carefully considers all aspects of this policy is essential to ensure the best outcomes for refugee students."
  }

  // Generate fallback response based on agent specialty and perspective
  if (agent.specialty?.includes("Trauma") || agent.perspective.includes("trauma")) {
    if (policyType.includes("psychological")) {
      return "Comprehensive mental health support is essential for refugee students to heal from trauma and succeed academically."
    } else {
      return "We must consider the psychological impact of our educational policies on children who have experienced significant trauma."
    }
  } else if (agent.specialty?.includes("Cultural") || agent.perspective.includes("cultural")) {
    if (policyType.includes("language")) {
      return "Preserving mother tongue education while gradually transitioning to the local language honors cultural identity while preparing students for success."
    } else {
      return "Cultural sensitivity must be at the heart of our approach to refugee education."
    }
  } else if (agent.specialty?.includes("Inclusion") || agent.perspective.includes("inclusion")) {
    return "Full integration with comprehensive support services creates the best long-term outcomes for both refugee students and host communities."
  } else if (agent.specialty?.includes("Evidence") || agent.perspective.includes("evidence")) {
    return "The data clearly shows that balanced approaches with targeted interventions provide the best educational outcomes within reasonable resource constraints."
  } else {
    return "A balanced approach that carefully considers all aspects of this policy is essential to ensure the best outcomes for refugee students."
  }
}
