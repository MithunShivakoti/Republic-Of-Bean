"use client"

import { usePolicyContext } from "@/providers/policy-provider"
import { policyQuestions } from "@/data/policy-questions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Undo } from "lucide-react"
import { PolicyIcons } from "@/components/policy-icons"

export function PolicySidebar() {
  const { policies, totalWeight, resetPolicies } = usePolicyContext()

  // Get the selected policies with details
  const selectedPolicies = Object.entries(policies)
    .map(([policyId, option]) => {
      const policyQuestion = policyQuestions.find((q) => q.id === Number.parseInt(policyId))
      const optionDetails = policyQuestion?.options.find((o) => o.id === option.id)

      return {
        policyId: Number.parseInt(policyId),
        policyName: policyQuestion?.title || "",
        optionId: option.id,
        weight: option.weight,
        text: optionDetails?.text || "",
      }
    })
    .sort((a, b) => a.policyId - b.policyId)

  // Count options by type
  const optionCounts = {
    1: 0,
    2: 0,
    3: 0,
  }

  Object.values(policies).forEach((policy) => {
    if (policy.id in optionCounts) {
      optionCounts[policy.id as keyof typeof optionCounts]++
    }
  })

  return (
    <div className="sticky top-4 w-full">
      <Card className="p-4 shadow-lg dark-card glow-card border border-primary/30 rounded-2xl">
        <div className="mb-4 border-b border-primary/20 pb-3">
          <h3 className="text-lg font-bold neon-text">Your Policy Package</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-100">Budget Used:</span>
            <span className="font-bold text-primary neon-text-primary">{totalWeight}/14 units</span>
          </div>
        </div>

        {/* Policy Tracker */}
        <div className="mb-4 border-b border-primary/20 pb-3">
          <h4 className="text-sm font-medium mb-2 neon-text">Policy Distribution</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-900/20 border border-green-600/30 p-2 rounded-xl">
              <div className="text-xl font-bold text-green-400">{optionCounts[1]}</div>
              <div className="text-xs text-gray-300">Option 1</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-600/30 p-2 rounded-xl">
              <div className="text-xl font-bold text-blue-400">{optionCounts[2]}</div>
              <div className="text-xs text-gray-300">Option 2</div>
            </div>
            <div className="bg-red-900/20 border border-red-600/30 p-2 rounded-xl">
              <div className="text-xl font-bold text-red-400">{optionCounts[3]}</div>
              <div className="text-xs text-gray-300">Option 3</div>
            </div>
          </div>
        </div>

        {/* Selected Policies */}
        <div className="mb-4 max-h-[300px] overflow-y-auto pr-1">
          <h4 className="text-sm font-medium mb-2 neon-text">Selected Policies</h4>
          {selectedPolicies.length > 0 ? (
            <ul className="space-y-2">
              {selectedPolicies.map((policy) => (
                <li key={policy.policyId} className="text-sm border border-primary/20 rounded-xl p-2 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <PolicyIcons policyId={policy.policyId} className="h-4 w-4 text-primary" />
                    <span className="font-medium neon-text">{policy.policyName}</span>
                  </div>
                  <div className="mt-1 flex justify-between items-center">
                    <span className="text-gray-300 text-xs">Option {policy.optionId}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        policy.optionId === 1
                          ? "bg-green-900/40 text-green-300"
                          : policy.optionId === 2
                            ? "bg-blue-900/40 text-blue-300"
                            : "bg-red-900/40 text-red-300"
                      }`}
                    >
                      {policy.weight} unit{policy.weight !== 1 ? "s" : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm italic">No policies selected yet</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full neon-button-secondary"
            onClick={() => window.history.back()}
          >
            <Undo className="mr-2 h-4 w-4" />
            <span className="text-white">Undo Last Choice</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full neon-button-secondary" onClick={resetPolicies}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="text-white">Reset All Selections</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
