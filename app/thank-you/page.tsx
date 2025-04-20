import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Home } from "lucide-react"

export default function ThankYouPage() {
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
            <CheckCircle className="h-12 w-12 text-secondary neon-text-secondary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 neon-gradient-text">Thank You!</h1>
          <div className="text-container inline-block">
            <p className="text-lg text-gray-100 neon-text">
              Your participation in the Republic of Bean parliamentary simulation is greatly appreciated.
            </p>
          </div>
        </div>

        <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <h2 className="text-2xl font-bold neon-text">Simulation Complete</h2>
          </div>
          <CardContent className="p-6 space-y-6 dark-card">
            <div className="text-center">
              <p className="text-gray-100 mb-4">
                You have successfully completed the Republic of Bean parliamentary simulation. Your decisions and
                reflections contribute to a deeper understanding of the complex challenges involved in refugee education
                policy.
              </p>

              <p className="text-gray-100 mb-6">
                This simulation was designed to highlight the tensions between individual preferences and collective
                decision-making, as well as the trade-offs inherent in policy development with limited resources.
              </p>

              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg mb-6">
                <h3 className="font-bold text-lg mb-2 neon-text">Key Takeaways</h3>
                <ul className="text-left space-y-2 text-gray-100">
                  <li>• Policy decisions involve complex trade-offs between competing values and interests</li>
                  <li>• Democratic processes often result in compromises that may not fully satisfy any individual</li>
                  <li>• Resource constraints force difficult choices about priorities</li>
                  <li>• Different stakeholders bring valuable but sometimes conflicting perspectives</li>
                </ul>
              </div>

              <Link href="/">
                <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all neon-button">
                  <Home className="mr-2 h-5 w-5" />
                  Return to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
