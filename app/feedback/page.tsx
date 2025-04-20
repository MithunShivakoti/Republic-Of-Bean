"use client"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { FeedbackForm } from "@/components/feedback-form"

export default function FeedbackPage() {
  const router = useRouter()

  const handleSubmitFeedback = (data: { rating?: number; feedback: string }) => {
    // Save feedback to localStorage
    localStorage.setItem(
      "beanFeedback",
      JSON.stringify({
        rating: data.rating,
        feedback: data.feedback,
      }),
    )
    router.push("/thank-you")
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

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-6 bg-primary/20 border border-primary/30 rounded-full mb-4 shadow-lg">
            <MessageSquare className="h-12 w-12 text-primary neon-text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 neon-gradient-text">Your Feedback</h1>
          <div className="text-container inline-block">
            <p className="text-lg text-gray-100 neon-text">
              Please share your thoughts about the Republic of Bean parliamentary simulation experience.
            </p>
          </div>
        </div>

        <FeedbackForm
          type="receive"
          title="Simulation Feedback"
          description="Your feedback helps us improve the simulation experience for future participants."
          onSubmit={handleSubmitFeedback}
        />
      </div>
    </div>
  )
}
