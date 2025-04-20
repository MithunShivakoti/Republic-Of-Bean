"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAgentContext } from "@/providers/agent-provider"
import { ArrowRight } from "lucide-react"

export default function MeetAgentsPage() {
  const router = useRouter()
  const { agents } = useAgentContext()

  // Redirect if no agents are loaded
  useEffect(() => {
    if (agents.length === 0) {
      router.push("/terms")
    }
  }, [agents, router])

  const handleContinue = () => {
    router.push("/policy/1")
  }

  return (
    <div className="bright-background min-h-screen py-12 px-4">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <div className="bright-pattern"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <Card className="shadow-lg overflow-hidden glow-card dark-card">
          <CardHeader className="text-center">
            <h1 className="text-3xl font-bold mb-2 neon-text">Meet Your Discussion Panel</h1>
            <p className="text-gray-100">
              These are the experts who will be joining you in policy discussions. Each brings unique expertise and
              perspectives to the table.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="bg-primary/5 border border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 neon-text">{agent.name}</h3>
                        <p className="text-sm text-gray-300 mb-2">{agent.title}</p>
                        <p className="text-sm text-gray-100">{agent.perspective}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-100 mb-6">
                You will be making policy decisions first, and then discussing them with these experts later. They will
                also be forming their own opinions on each policy.
              </p>
              <Button onClick={handleContinue} className="gap-2 neon-button">
                <span className="text-white">Begin Policy Decisions</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
