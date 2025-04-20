"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Save, ArrowLeft, ArrowRight, Mic, MicOff } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type Question = {
  id: number
  text: string
  answer: string
}

// Declare SpeechRecognition interface
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function QuestionnairePage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      text: "What emotions came up for you during the decision-making process—discomfort, frustration, detachment, guilt? What do those feelings reveal about your position in relation to refugee education?",
      answer: "",
    },
    {
      id: 2,
      text: "Did anything about your role in the game feel familiar—either from your personal or professional life? If so, how?",
      answer: "",
    },
    {
      id: 3,
      text: "What assumptions about refugees, policy, or education were challenged or reinforced during the game?",
      answer: "",
    },
    {
      id: 4,
      text: "How did the group dynamics impact your ability to advocate for certain policies? Were there moments when you chose silence or compromise? Why?",
      answer: "",
    },
    {
      id: 5,
      text: 'Has your understanding of refugee education shifted from seeing it as a service "for them" to a system embedded in broader struggles over power, identity, and justice? If so, how?',
      answer: "",
    },
    {
      id: 6,
      text: "Whose interests did your decisions ultimately serve—refugees, citizens, or the state? Why?",
      answer: "",
    },
    {
      id: 7,
      text: "What power did you assume you had as a policymaker—and who did you imagine was absent or voiceless in that process?",
      answer: "",
    },
    {
      id: 8,
      text: "What compromises did you make for the sake of consensus, and who or what got erased in the process?",
      answer: "",
    },
    {
      id: 9,
      text: "How did the structure of the game (budget, options, scenario) shape or limit your imagination of justice?",
      answer: "",
    },
    {
      id: 10,
      text: "If refugee education wasn't about inclusion into existing systems—but about transforming those systems—what would that look like, and did your decisions move toward or away from that?",
      answer: "",
    },
  ])

  const currentQuestion = questions[currentQuestionIndex]
  const isCurrentAnswerEmpty = !currentQuestion.answer.trim()

  // Speech recognition setup
  useEffect(() => {
    let recognition: SpeechRecognition | null = null

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("")

        if (event.results[0].isFinal) {
          const updatedQuestions = [...questions]
          updatedQuestions[currentQuestionIndex].answer =
            updatedQuestions[currentQuestionIndex].answer + " " + transcript
          setQuestions(updatedQuestions)
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
        toast({
          title: "Speech Recognition Error",
          description: "There was an error with speech recognition. Please try again or type your answer.",
          variant: "destructive",
        })
      }
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [currentQuestionIndex, questions])

  const toggleListening = () => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please type your answer instead.",
        variant: "destructive",
      })
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (isListening) {
      const recognition = new SpeechRecognition()
      recognition.stop()
      setIsListening(false)
    } else {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("")

        if (event.results[0].isFinal) {
          const updatedQuestions = [...questions]
          updatedQuestions[currentQuestionIndex].answer = (
            updatedQuestions[currentQuestionIndex].answer +
            " " +
            transcript
          ).trim()
          setQuestions(updatedQuestions)
        }
      }

      recognition.start()
    }
  }

  const handleAnswerChange = (answer: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].answer = answer
    setQuestions(updatedQuestions)
  }

  const handleNext = () => {
    // Check if the current answer is empty
    if (isCurrentAnswerEmpty) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before continuing.",
        variant: "destructive",
      })
      return
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Save answers to localStorage
      localStorage.setItem("beanReflectionAnswers", JSON.stringify(questions))
      router.push("/ideal-feedback")
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

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
            <BookOpen className="h-12 w-12 text-primary neon-text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 neon-gradient-text">Reflection Questions</h1>
          <div className="text-container inline-block">
            <p className="text-lg text-gray-100 neon-text">
              Please take a moment to reflect on your experience in the Republic of Bean parliamentary simulation.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 shadow-md flex items-center justify-center text-primary font-bold neon-text-primary">
              {currentQuestionIndex + 1}
            </div>
            <span className="ml-2 text-sm font-medium bg-primary/10 border border-primary/30 px-3 py-1 rounded-full shadow-sm text-gray-100 neon-text">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="budget-display">
            <Save className="h-4 w-4 text-primary neon-text-primary" />
            <span>Reflection Phase</span>
          </div>
        </div>

        <div className="progress-container mb-8">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
          <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <h2 className="text-xl font-semibold neon-text-primary">Question {currentQuestionIndex + 1}</h2>
          </CardHeader>

          <CardContent className="p-6 dark-card">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 neon-text">{currentQuestion.text}</h3>
              <div className="relative">
                <Textarea
                  value={currentQuestion.answer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your reflection here... (required)"
                  className="min-h-[200px] bg-primary/10 border-primary/30 text-gray-100 rounded-xl pr-12"
                />
                <Button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-2 top-2 p-2 rounded-full ${
                    isListening ? "bg-red-500 hover:bg-red-600" : "bg-primary/50 hover:bg-primary/70"
                  }`}
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                >
                  {isListening ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
                </Button>
                {isCurrentAnswerEmpty && <p className="text-red-400 text-sm mt-1">This field is required</p>}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-t border-primary/20">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="gap-2 neon-button-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-white">Previous</span>
            </Button>
            <Button onClick={handleNext} className="gap-2 neon-button" disabled={isCurrentAnswerEmpty}>
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  <span className="text-white">Next</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <span className="text-white">View Ideal Policies</span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
