import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Landmark, Users, AlertTriangle, Globe, TrendingDown, BookOpen, ScrollText } from "lucide-react"

export default function Information() {
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
          <h1 className="text-4xl font-bold mb-4 neon-text-primary bg-primary/10 py-2 px-4 rounded-lg inline-block border border-primary/30">
            Republic of Bean
          </h1>
          <p className="text-lg text-gray-100 max-w-2xl mx-auto text-container neon-text">
            A nation facing challenges and opportunities in a changing world
          </p>
        </div>

        <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <h2 className="text-2xl font-bold neon-text">Background Information</h2>
          </div>
          <CardContent className="pt-6 space-y-6 dark-card">
            <div className="flex gap-4">
              <Landmark className="h-8 w-8 text-primary shrink-0 mt-1 neon-text-primary" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Government & Society</h3>
                <p className="text-gray-100">
                  You are an honorable member of parliament in the Republic of Bean, a unique nation situated in a
                  distant realm beyond Earth. While the country is not wealthy, its citizens enjoy free access to
                  education, healthcare, and various public services. The Republic of Bean prides itself on its
                  multicultural society, comprising three ethnicities and two religious minority groups.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Users className="h-8 w-8 text-primary shrink-0 mt-1 neon-text-primary" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Cultural Diversity</h3>
                <p className="text-gray-100">
                  Thanks to the country's commitment to secularism, citizens are free to practice their religions
                  without any obstacles. However, due to safety concerns, the nation follows many monolithic praxis and
                  policies, which includes a monolingual education system and teaching only Grapes' , the majority
                  group, history, and literature. Also, Grapes' language, Teanish is the only official language is used
                  for the public services.
                </p>
                <p className="text-gray-100 mt-2">
                  The largest minority group in the Republic of Bean is the Curly Hairs, who possess distinct ethnic
                  backgrounds and their own language. They have long been advocating for their cultural rights, with a
                  specific focus on education in their mother tongue. The Curly Hairs make up approximately 22% of the
                  country's total population.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <AlertTriangle className="h-8 w-8 text-primary shrink-0 mt-1 neon-text-primary" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Internal Challenges</h3>
                <p className="text-gray-100">
                  While poverty is not a prevalent issue in the Republic of Bean, the nation suffer from corruption,
                  which angers citizens. In response, citizens occasionally take to the streets in protest, sometimes
                  resulting in clashes with the police. Additionally, Grapes seeks to maintain their dominance in the
                  administration and bureaucracy. They hold the belief that sharing power with other groups would
                  jeopardize the nation's future.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Globe className="h-8 w-8 text-secondary shrink-0 mt-1 neon-text-secondary" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Refugee Crisis</h3>
                <p className="text-gray-100">
                  The Republic of Bean shares borders with four neighboring countries, three of which enjoy stable
                  conditions. However, the country's northwestern neighbor, Orangenya, is currently experiencing
                  internal conflicts. As a result, two million individuals have sought refuge in the Republic of Bean,
                  comprising 14% of its entire population. Despite their geographic proximity, these refugees and the
                  citizens of the Republic of Bean possess numerous cultural differences.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <TrendingDown className="h-8 w-8 text-secondary shrink-0 mt-1 neon-text-secondary" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Economic Situation</h3>
                <p className="text-gray-100">
                  In the aftermath of a global economic crisis, the Republic of Bean's economy has become increasingly
                  unstable. Moreover, other nations worldwide are hesitant to extend solidarity towards the country.
                  This unfortunately promotes xenophobia and political debates, leading to heightened polarization
                  within the nation.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <BookOpen className="h-8 w-8 text-accent shrink-0 mt-1 neon-text-accent" />
              <div>
                <h3 className="font-semibold text-lg mb-2 neon-text">Educational Reform</h3>
                <p className="text-gray-100">
                  In response to these challenges, the parliament has initiated an educational reform aimed at providing
                  contemporary, quality, and accessible education for all refugees. Also, the parliament wants to focus
                  on the social integration of refugees to prevent possible conflicts.
                </p>
                <p className="text-gray-100 mt-2">
                  As a member of parliament, you bear the responsibility of actively participating in and contributing
                  to this reform process. The reform package comprises 7 key factors, and you will be tasked with
                  choosing an option from each factor, ensuring the allocation of limited resources. By making these
                  decisions, you can help shape the future of refugee education in the Republic of Bean.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg overflow-hidden glow-card dark-card">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-primary/30">
            <div className="flex items-center">
              <ScrollText className="h-6 w-6 mr-2 text-primary neon-text-primary" />
              <h2 className="text-2xl font-bold neon-text">Rules of Engagement</h2>
            </div>
          </div>
          <CardContent className="pt-6 dark-card">
            <ul className="space-y-4">
              <li className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg shadow-sm border border-primary/20">
                <h3 className="font-bold text-lg mb-1 neon-text-primary">Budget Limit</h3>
                <p className="text-gray-100">
                  Your team has a total budget of{" "}
                  <span className="text-primary font-bold neon-text-primary">14 units</span> to allocate across all
                  policy decisions.
                </p>
              </li>

              <li className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg shadow-sm border border-primary/20">
                <h3 className="font-bold text-lg mb-1 neon-text-primary">Option Costs</h3>
                <p className="text-gray-100">Each policy option has a specific cost:</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-primary/10 p-2 rounded-md text-center font-medium border border-primary/30 shadow-sm text-green-100 neon-text-secondary">
                    Option 1: 1 unit
                  </div>
                  <div className="bg-secondary/10 p-2 rounded-md text-center font-medium border border-secondary/30 shadow-sm text-yellow-100 neon-text-secondary">
                    Option 2: 2 units
                  </div>
                  <div className="bg-accent/10 p-2 rounded-md text-center font-medium border border-accent/30 shadow-sm text-orange-100 neon-text-accent">
                    Option 3: 3 units
                  </div>
                </div>
              </li>

              <li className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg shadow-sm border border-primary/20">
                <h3 className="font-bold text-lg mb-1 neon-text-primary">Budget Management</h3>
                <p className="text-gray-100">
                  You must ensure that the total cost of your chosen policies does not exceed the 14-unit budget.
                  Balance the costs of each decision while addressing the needs of the refugees and the nation.
                </p>
              </li>

              <li className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg shadow-sm border border-primary/20">
                <h3 className="font-bold text-lg mb-1 neon-text-primary">Policy Selection Variety</h3>
                <p className="text-gray-100">
                  You cannot select all your policies from just one option across the seven policy areas. For example,
                  you cannot choose only Option 1 or only Option 2 for all seven policy decisions. Ensure a mix of
                  options to encourage balanced decision-making.
                </p>
              </li>

              <li className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg shadow-sm border border-primary/20">
                <h3 className="font-bold text-lg mb-1 neon-text-primary">Strategic Decision-Making</h3>
                <p className="text-gray-100">
                  Consider the advantages and disadvantages of each policy option. Your goal is to create an effective
                  and inclusive refugee education package within the budget constraints.
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/terms">
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all neon-button">
              <ScrollText className="mr-2 h-5 w-5" />
              Continue to Parliamentary Oath
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
