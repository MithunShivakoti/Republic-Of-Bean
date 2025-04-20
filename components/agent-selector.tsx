"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { useAgentContext } from "@/providers/agent-provider"

interface AgentSelectorProps {
  onAgentSelect: (agentId: string) => void
  onUserMessage: (message: string) => void
  selectedAgentId: string | null
}

export function AgentSelector({ onAgentSelect, onUserMessage, selectedAgentId }: AgentSelectorProps) {
  const { agents } = useAgentContext()
  const [inputValue, setInputValue] = useState("")

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onUserMessage(inputValue)
      setInputValue("")
    }
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 neon-text">Select an agent to speak with:</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-all ${
              selectedAgentId === agent.id ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
            onClick={() => onAgentSelect(agent.id)}
          >
            <CardContent className="p-4 flex flex-col items-center">
              <div className="text-4xl mb-2">{agent.avatar}</div>
              <h4 className="font-medium text-center text-gray-100">{agent.name}</h4>
              <p className="text-xs text-gray-300 text-center mt-1">{agent.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAgentId && (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Type your message to ${
                selectedAgentId ? agents.find((a) => a.id === selectedAgentId)?.name : "the agent"
              }...`}
              className="flex-1 p-3 border rounded-md min-h-[80px] resize-none bg-primary/10 border-primary/30 text-gray-100"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!inputValue.trim()} className="neon-button">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
