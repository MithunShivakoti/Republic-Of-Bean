"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollText, ArrowRight } from "lucide-react"

export default function TermsPage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)

  const handleContinue = () => {
    if (accepted) {
      router.push("/meet-agents")
    }
  }

  return (
    <div className="bright-background min-h-screen py-12 px-4">
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>
      <div className="bright-pattern"></div>

      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 neon-gradient-text">Parliamentary Oath</h1>
          <p className="text-lg text-gray-100 neon-text">
            Before you begin your work on the education reform committee
          </p>
        </div>

        <Card className="shadow-lg overflow-hidden glow-card dark-card">
          <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <div className="flex items-center">
              <ScrollText className="h-6 w-6 mr-2 text-primary neon-text-primary" />
              <h2 className="text-2xl font-bold neon-text">Official Oath of Office</h2>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 dark-card">
            <div className="bg-primary/10 p-6 rounded-lg border border-primary/30 text-container">
              <p className="text-gray-100 italic">
                "I, as a member of the Republic of Bean Parliament, do solemnly swear that I will support and defend the
                Constitution of the Republic of Bean against all enemies, foreign and domestic; that I will bear true
                faith and allegiance to the same; that I take this obligation freely, without any mental reservation or
                purpose of evasion; and that I will well and faithfully discharge the duties of the office on which I am
                about to enter. So help me God."
              </p>
            </div>

            <div className="bg-secondary/10 p-6 rounded-lg border border-secondary/30 text-container">
              <h3 className="font-bold text-lg mb-3 neon-text">Your Responsibilities</h3>
              <ul className="space-y-2 text-gray-100">
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span>
                    To make decisions that prioritize the well-being of all citizens of the Republic of Bean, including
                    refugees
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span>To allocate the limited budget resources responsibly and effectively</span>
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span>
                    To consider the long-term implications of your policy decisions on social cohesion and integration
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span>
                    To collaborate with other parliament members, even when their perspectives differ from your own
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">•</span>
                  <span>To uphold the democratic values and principles of the Republic of Bean</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(!!checked)} />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-100"
              >
                I accept the parliamentary oath and understand my responsibilities
              </label>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-primary/20">
            <Button
              onClick={handleContinue}
              disabled={!accepted}
              className={`gap-2 ${accepted ? "neon-button" : "opacity-50"}`}
            >
              <span className="text-white">Continue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
