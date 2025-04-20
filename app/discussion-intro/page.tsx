"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePolicyContext } from "@/providers/policy-provider"
import { useAgentContext } from "@/providers/agent-provider"
import { Users, MessageSquare, Vote, CheckCircle } from "lucide-react"

export default function DiscussionIntro() {
  const router = useRouter()
  const { policies } = usePolicyContext()
  const { agents } = useAgentContext()

  // Check if user has completed individual policy selection
  useEffect(() => {
    const selectedPolicies = Object.keys(policies).length
    if (selectedPolicies < 7) {
      router.push("/policy/1")
    }
  }, [policies, router])

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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-6 bg-primary/20 border border-primary/30 rounded-full mb-4 shadow-lg">
            <Users className="h-12 w-12 text-primary neon-text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 neon-gradient-text">Parliamentary Discussion</h1>
          <div className="text-container inline-block">
            <p className="text-lg text-gray-100 neon-text">
              Thank you for completing your individual policy survey. Now it's time for parliamentary debate!
            </p>
          </div>
        </div>

        <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <h2 className="text-2xl font-bold neon-text">The Parliamentary Process</h2>
          </div>
          <CardContent className="pt-6 space-y-6 dark-card">
            <div className="flex gap-4">
              <MessageSquare className="h-8 w-8 text-primary shrink-0 mt-1 neon-text-primary" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Group Discussion</h3>
                <p className="text-gray-100">
                  You will now discuss each policy question with four other parliamentary members, each representing
                  different perspectives and interests. Listen to their arguments and share your own thoughts before
                  voting.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Vote className="h-8 w-8 text-secondary shrink-0 mt-1 neon-text-secondary" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Democratic Voting</h3>
                <p className="text-gray-100">
                  After each discussion, all five members (including you) will vote on the policy option. The option
                  with the most votes will be selected for the final policy package, regardless of your individual
                  preference.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle className="h-8 w-8 text-accent shrink-0 mt-1 neon-text-accent" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Collective Decision</h3>
                <p className="text-gray-100">
                  This process represents the reality of policy-making, where compromise and collective decision-making
                  often lead to outcomes different from individual preferences. Your challenge is to persuade others
                  while remaining open to their perspectives.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <h2 className="text-2xl font-bold neon-text">Meet Your Fellow Parliament Members</h2>
          </div>
          <CardContent className="pt-6 dark-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <div key={agent.id} className="flex gap-4 p-4 bg-primary/10 rounded-lg border border-primary/30">
                  <div className="text-4xl">{agent.avatarUrl ? "👤" : agent.avatar || "👤"}</div>
                  <div>
                    <h3 className="font-bold text-lg neon-text">{agent.name}</h3>
                    <p className="text-secondary neon-text-secondary text-sm">{agent.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/discussion/1">
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all neon-button">
              <MessageSquare className="mr-2 h-5 w-5" />
              Begin Parliamentary Discussion
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
