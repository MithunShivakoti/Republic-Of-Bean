"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type PolicyOption = {
  id: number
  weight: number
  selected: boolean
}

type PolicyState = {
  [key: number]: PolicyOption
}

type PolicyContextType = {
  policies: PolicyState
  totalWeight: number
  selectPolicy: (policyId: number, optionId: number, weight: number) => void
  canSelectOption: (weight: number) => boolean
  getRemainingWeight: () => number
  getSelectedPolicies: () => { policyId: number; optionId: number; weight: number }[]
  resetPolicies: () => void
  areAllSelectionsIdentical: () => boolean
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined)

export function PolicyProvider({ children }: { children: React.ReactNode }) {
  const [policies, setPolicies] = useState<PolicyState>({})
  const [totalWeight, setTotalWeight] = useState(0)

  // Initialize policies from localStorage if available
  useEffect(() => {
    const savedPolicies = localStorage.getItem("beanPolicies")
    const savedTotalWeight = localStorage.getItem("beanTotalWeight")

    if (savedPolicies && savedTotalWeight) {
      setPolicies(JSON.parse(savedPolicies))
      setTotalWeight(Number(savedTotalWeight))
    }
  }, [])

  // Save policies to localStorage when they change
  useEffect(() => {
    if (Object.keys(policies).length > 0) {
      localStorage.setItem("beanPolicies", JSON.stringify(policies))
      localStorage.setItem("beanTotalWeight", totalWeight.toString())
    }
  }, [policies, totalWeight])

  const selectPolicy = (policyId: number, optionId: number, weight: number) => {
    setPolicies((prev) => {
      // Calculate the new total weight by subtracting the weight of the previously selected option (if any)
      const previousWeight = prev[policyId]?.weight || 0
      const newTotalWeight = totalWeight - previousWeight + weight

      // Update the total weight
      setTotalWeight(newTotalWeight)

      // Return the updated policies
      return {
        ...prev,
        [policyId]: {
          id: optionId,
          weight,
          selected: true,
        },
      }
    })
  }

  const canSelectOption = (weight: number) => {
    return totalWeight + weight <= 14
  }

  const getRemainingWeight = () => {
    return 14 - totalWeight
  }

  const getSelectedPolicies = () => {
    return Object.entries(policies).map(([policyId, option]) => ({
      policyId: Number(policyId),
      optionId: option.id,
      weight: option.weight,
    }))
  }

  // Check if all selected options are identical
  const areAllSelectionsIdentical = () => {
    const selectedPolicies = Object.values(policies)
    if (selectedPolicies.length <= 1) return false

    // If we have all 7 policies selected, check if they're all the same
    if (selectedPolicies.length === 7) {
      const firstOptionId = selectedPolicies[0].id
      return selectedPolicies.every((policy) => policy.id === firstOptionId)
    }

    return false
  }

  const resetPolicies = () => {
    setPolicies({})
    setTotalWeight(0)
    localStorage.removeItem("beanPolicies")
    localStorage.removeItem("beanTotalWeight")
  }

  return (
    <PolicyContext.Provider
      value={{
        policies,
        totalWeight,
        selectPolicy,
        canSelectOption,
        getRemainingWeight,
        getSelectedPolicies,
        resetPolicies,
        areAllSelectionsIdentical,
      }}
    >
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicyContext() {
  const context = useContext(PolicyContext)
  if (context === undefined) {
    throw new Error("usePolicyContext must be used within a PolicyProvider")
  }
  return context
}
