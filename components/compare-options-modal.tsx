"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { policyQuestions } from "@/data/policy-questions"
import { PolicyIcons } from "@/components/policy-icons"

type CompareOptionsProps = {
  policyId: number
}

export function CompareOptionsModal({ policyId }: CompareOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const policy = policyQuestions.find((q) => q.id === policyId)

  if (!policy) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-xs px-2 py-1 h-auto bg-primary/10 border-primary/30 hover:bg-primary/20"
      >
        Compare Options
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl dark-card border-primary/30 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 neon-text">
              <PolicyIcons policyId={policyId} className="h-5 w-5" />
              Compare Options: {policy.title}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {policy.options.map((option) => (
              <div
                key={option.id}
                className={`p-4 rounded-xl border ${
                  option.id === 1
                    ? "bg-green-900/20 border-green-600/30"
                    : option.id === 2
                      ? "bg-blue-900/20 border-blue-600/30"
                      : "bg-red-900/20 border-red-600/30"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold neon-text">Option {option.id}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      option.id === 1
                        ? "bg-green-900/40 text-green-300"
                        : option.id === 2
                          ? "bg-blue-900/40 text-blue-300"
                          : "bg-red-900/40 text-red-300"
                    }`}
                  >
                    {option.weight} unit{option.weight !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-gray-100 text-sm">{option.text}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
