"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star, MessageSquare } from "lucide-react"

type FeedbackFormProps = {
  type: "give" | "receive"
  onSubmit: (data: { rating?: number; feedback: string }) => void
  title: string
  description: string
}

export function FeedbackForm({ type, onSubmit, title, description }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState("")
  const [rating, setRating] = useState<number | null>(null)

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit({
        rating: rating || undefined,
        feedback,
      })
    }
  }

  return (
    <Card className="shadow-lg overflow-hidden glow-card dark-card rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 mr-2 text-primary neon-text-primary" />
          <h2 className="text-2xl font-bold neon-text">{title}</h2>
        </div>
        <p className="text-gray-100 mt-2">{description}</p>
      </CardHeader>

      <CardContent className="p-6 dark-card space-y-6">
        {type === "receive" && (
          <div>
            <h3 className="text-lg font-medium mb-4 neon-text">How would you rate your experience?</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={`p-2 rounded-full h-12 w-12 flex items-center justify-center transition-all ${
                    rating === value
                      ? "bg-primary/30 border-2 border-primary"
                      : "bg-primary/10 border border-primary/30"
                  }`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating !== null && value <= rating
                        ? "text-secondary fill-secondary neon-text-secondary"
                        : "text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium mb-4 neon-text">
            {type === "give" ? "Your Feedback:" : "Share your thoughts:"}
          </h3>
          <Textarea
            placeholder={
              type === "give"
                ? "Here's what we think about your performance..."
                : "Share your thoughts, suggestions, or any other feedback..."
            }
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[150px] bg-primary/10 border-primary/30 text-gray-100 rounded-xl"
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-end p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-primary/20">
        <Button onClick={handleSubmit} className="gap-2 neon-button rounded-xl" disabled={!feedback.trim()}>
          Submit Feedback
        </Button>
      </CardFooter>
    </Card>
  )
}
