"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Users } from "lucide-react"
import { useAgentContext } from "@/providers/agent-provider"

export function AgentSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const { agents } = useAgentContext()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
    if (isOpen) {
      setSelectedAgentId(null)
    }
  }

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(agentId)
  }

  const handleBackClick = () => {
    setSelectedAgentId(null)
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full z-30 transition-all duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="relative h-full">
        {/* Toggle button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-6 -left-12 h-10 w-10 rounded-l-xl border-r-0 bg-primary/20 border-primary/30 shadow-lg neon-button-secondary"
          onClick={toggleSidebar}
        >
          {isOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>

        {/* Sidebar content */}
        <Card className="h-full w-80 rounded-l-xl rounded-r-none border-r-0 shadow-xl overflow-hidden dark-card border-primary/30">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-4 bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30">
              <h2 className="text-xl font-bold neon-text flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parliament Members
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedAgentId ? (
                <div>
                  <Button variant="outline" size="sm" className="mb-4 neon-button-secondary" onClick={handleBackClick}>
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    <span className="text-white">Back to Members</span>
                  </Button>

                  {/* Display selected agent details */}
                  {(() => {
                    const agent = agents.find((a) => a.id === selectedAgentId)
                    if (!agent) return null

                    return (
                      <div className="p-4 border border-primary/30 rounded-lg bg-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="text-4xl">{agent.avatar}</div>
                          <div>
                            <h3 className="font-bold text-lg neon-text">{agent.name}</h3>
                            <p className="text-secondary neon-text-secondary text-sm">{agent.role}</p>
                          </div>
                        </div>

                        <p className="text-gray-100 text-sm mb-4">{agent.shortBio}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-1 bg-primary/20 border border-primary/30 rounded-full text-xs">
                            {agent.specialty}
                          </span>
                          <span className="px-2 py-1 bg-secondary/20 border border-secondary/30 rounded-full text-xs">
                            {agent.perspective}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <>
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-3 border border-primary/20 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors"
                      onClick={() => handleAgentClick(agent.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-xl">
                          {agent.avatar}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-100">{agent.name}</h3>
                          <p className="text-xs text-gray-300">{agent.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
