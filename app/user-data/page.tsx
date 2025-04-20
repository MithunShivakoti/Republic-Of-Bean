"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function UserDataPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    age: "",
    nationality: "",
    occupation: "",
    educationLevel: "",
    displacementExperience: "",
    displacementNarrative: "",
    city: "",
    country: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formSubmitted, setFormSubmitted] = useState(false)

  const educationLevels = [
    "Primary education",
    "Secondary education",
    "High school diploma",
    "Bachelor's degree",
    "Master's degree",
    "Doctoral degree",
    "Vocational training",
    "Other",
  ]

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate age (must be a number between 18 and 100)
    if (!formData.age) {
      newErrors.age = "Age is required"
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 18 || Number(formData.age) > 100) {
      newErrors.age = "Please enter a valid age between 18 and 100"
    }

    // Validate other required fields
    if (!formData.nationality.trim()) newErrors.nationality = "Nationality is required"
    if (!formData.occupation.trim()) newErrors.occupation = "Occupation is required"
    if (!formData.educationLevel) newErrors.educationLevel = "Education level is required"
    if (!formData.displacementExperience) newErrors.displacementExperience = "This field is required"

    // If displacement experience is "Yes", narrative is required
    if (formData.displacementExperience === "Yes" && !formData.displacementNarrative.trim()) {
      newErrors.displacementNarrative = "Please provide details about your displacement experience"
    }

    if (!formData.city.trim()) newErrors.city = "City is required"
    if (!formData.country.trim()) newErrors.country = "Country is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)

    if (validateForm()) {
      // Save user data to localStorage
      localStorage.setItem("beanUserData", JSON.stringify(formData))

      // Navigate to the next page
      router.push("/terms")
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0]
      const errorElement = document.getElementById(firstErrorField)
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <Card className="border border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl font-bold neon-text">Welcome to Republic of Bean</CardTitle>
          <CardDescription>
            Before we begin the simulation, please provide some information about yourself. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age" className={errors.age ? "text-destructive" : ""}>
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className={errors.age ? "border-destructive" : ""}
                />
                {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
              </div>

              {/* Nationality */}
              <div className="space-y-2">
                <Label htmlFor="nationality" className={errors.nationality ? "text-destructive" : ""}>
                  Nationality
                </Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  className={errors.nationality ? "border-destructive" : ""}
                />
                {errors.nationality && <p className="text-sm text-destructive">{errors.nationality}</p>}
              </div>

              {/* Occupation */}
              <div className="space-y-2">
                <Label htmlFor="occupation" className={errors.occupation ? "text-destructive" : ""}>
                  Occupation
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  className={errors.occupation ? "border-destructive" : ""}
                />
                {errors.occupation && <p className="text-sm text-destructive">{errors.occupation}</p>}
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <Label htmlFor="educationLevel" className={errors.educationLevel ? "text-destructive" : ""}>
                  Educational Level
                </Label>
                <Select
                  value={formData.educationLevel}
                  onValueChange={(value) => handleChange("educationLevel", value)}
                >
                  <SelectTrigger id="educationLevel" className={errors.educationLevel ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.educationLevel && <p className="text-sm text-destructive">{errors.educationLevel}</p>}
              </div>

              {/* Displacement Experience */}
              <div className="space-y-2">
                <Label className={errors.displacementExperience ? "text-destructive" : ""}>
                  Have you ever experienced displacement?
                </Label>
                <RadioGroup
                  value={formData.displacementExperience}
                  onValueChange={(value) => handleChange("displacementExperience", value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="displacement-yes" />
                    <Label htmlFor="displacement-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="displacement-no" />
                    <Label htmlFor="displacement-no">No</Label>
                  </div>
                </RadioGroup>
                {errors.displacementExperience && (
                  <p className="text-sm text-destructive">{errors.displacementExperience}</p>
                )}
              </div>

              {/* Displacement Narrative (conditional) */}
              {formData.displacementExperience === "Yes" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="displacementNarrative"
                    className={errors.displacementNarrative ? "text-destructive" : ""}
                  >
                    Please share details about your displacement experience
                  </Label>
                  <Textarea
                    id="displacementNarrative"
                    value={formData.displacementNarrative}
                    onChange={(e) => handleChange("displacementNarrative", e.target.value)}
                    className={errors.displacementNarrative ? "border-destructive" : ""}
                    rows={4}
                  />
                  {errors.displacementNarrative && (
                    <p className="text-sm text-destructive">{errors.displacementNarrative}</p>
                  )}
                </div>
              )}

              {/* Current Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className={errors.city ? "text-destructive" : ""}>
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={errors.city ? "border-destructive" : ""}
                  />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className={errors.country ? "text-destructive" : ""}>
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    className={errors.country ? "border-destructive" : ""}
                  />
                  {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                </div>
              </div>
            </div>

            {formSubmitted && Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Please fill in all required fields correctly.</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button type="submit" className="neon-button gap-2">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
