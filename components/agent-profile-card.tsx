"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import agentProfilesData from "@/data/agent-profiles"
import extendedAgentProfiles from "@/data/agent-profiles-extended"
import { Badge } from "@/components/ui/badge"

interface AgentProfileCardProps {
  agentId: string
}

export default function AgentProfileCard({ agentId }: AgentProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Find the agent and extended profile
  const agent = agentProfilesData.find((a) => a.id === agentId)
  const extendedProfile = extendedAgentProfiles.find((profile) => profile.id === agentId)

  if (!agent || !extendedProfile) {
    return null
  }

  // Create a sanitized version of the agent's role by removing sensitive information
  const sanitizedRole = agent.role
    .replace(/former refugee/i, "education specialist")
    .replace(/UNESCO/i, "international organization")
    .replace(/refugee camp/i, "educational setting")
    .replace(/refugee/i, "student")

  return (
    <Card className="mb-4 agent-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/20 flex items-center justify-center">
            <span className="text-3xl">{agent.avatar}</span>
          </div>
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription>{sanitizedRole}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm mb-2">{agent.shortBio}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline">{agent.specialty}</Badge>
          <Badge variant="secondary">{agent.perspective}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              View Full Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto dark-card border-primary/30">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{extendedProfile.name}</span>
                <Badge>{sanitizedRole}</Badge>
              </DialogTitle>
              <DialogDescription>Expert in {agent.specialty}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <span className="text-5xl">{agent.avatar}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1 neon-text">Biography</h3>
                <p className="text-sm text-gray-100">
                  {extendedProfile.fullBio
                    .replace(/former refugee/i, "education specialist")
                    .replace(/UNESCO/i, "international organization")
                    .replace(/refugee camp/i, "educational setting")
                    .replace(/refugee/i, "student")}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1 neon-text">Background</h3>
                <p className="text-sm text-gray-100">
                  {extendedProfile.background
                    .replace(/former refugee/i, "education specialist")
                    .replace(/UNESCO/i, "international organization")
                    .replace(/refugee camp/i, "educational setting")
                    .replace(/refugee/i, "student")}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1 neon-text">Core Values</h3>
                <ul className="list-disc pl-5 text-sm text-gray-100">
                  {extendedProfile.values.map((value, index) => (
                    <li key={index}>
                      {value
                        .replace(/former refugee/i, "education specialist")
                        .replace(/UNESCO/i, "international organization")
                        .replace(/refugee camp/i, "educational setting")
                        .replace(/refugee/i, "student")}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1 neon-text">Approach</h3>
                <p className="text-sm text-gray-100">
                  {extendedProfile.approach
                    .replace(/former refugee/i, "education specialist")
                    .replace(/UNESCO/i, "international organization")
                    .replace(/refugee camp/i, "educational setting")
                    .replace(/refugee/i, "student")}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1 neon-text">Areas of Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {extendedProfile.expertise.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-primary/10 border-primary/30">
                      {skill
                        .replace(/former refugee/i, "education specialist")
                        .replace(/UNESCO/i, "international organization")
                        .replace(/refugee camp/i, "educational setting")
                        .replace(/refugee/i, "student")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-primary/10 p-3 rounded-md italic text-sm border border-primary/30">
                <span className="text-gray-100">
                  "
                  {extendedProfile.quote
                    .replace(/former refugee/i, "education specialist")
                    .replace(/UNESCO/i, "international organization")
                    .replace(/refugee camp/i, "educational setting")
                    .replace(/refugee/i, "student")}
                  "
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
