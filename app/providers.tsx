"use client"

import type React from "react"

import { PolicyProvider } from "@/providers/policy-provider"
import { AgentProvider } from "@/providers/agent-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PolicyProvider>
      <AgentProvider>{children}</AgentProvider>
    </PolicyProvider>
  )
}
