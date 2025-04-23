"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PDFExport } from "@/components/pdf-export"

export default function IdealFeedbackPage() {
  const [activeTab, setActiveTab] = useState("education")

  const policies = [{ id: "education", label: "Education" }]

  // New ideal content for education based on the provided information
  const educationIdealContent = {
    title: "Ideal Stance on Refugee Education",
    description: "Balanced approach focusing on integration while respecting cultural identity (14 Units Total)",
    content: [
      {
        factor: "1. Access to Education",
        option: "Option 3 (3 Units)",
        reasoning:
          "Equal access & integration into mainstream schools - Integration avoids segregation, improves language acquisition, and promotes social cohesion. Countries like Germany and Canada successfully integrated Syrian and Afghan refugees into public schools, showing better academic outcomes and community acceptance. UNESCO and UNHCR both highlight integration as the gold standard for inclusion. Tradeoff: Requires more training and classroom resources.",
      },
      {
        factor: "2. Language Instruction",
        option: "Option 3 (3 Units)",
        reasoning:
          "Bilingual education (Teanish + mother tongue) - Preserving a child's first language supports identity and long-term learning, while host language acquisition is crucial for integration. Finland and Norway offer mother tongue instruction alongside Finnish/Norwegian, yielding strong literacy development and cultural dignity. The World Bank links bilingual education to better retention and confidence. Tradeoff: Needs bilingual teachers and customized materials.",
      },
      {
        factor: "3. Teacher Training",
        option: "Option 2 (2 Units)",
        reasoning:
          "Moderate training on refugee needs - While specialized training is ideal, many countries face teacher shortages. A moderate training approach (like Jordan's INEE-based teacher workshops) equips teachers to handle trauma, language barriers, and diverse classrooms without overburdening the system. Tradeoff: May miss deeper cultural sensitivity but is scalable and impactful.",
      },
      {
        factor: "4. Psychosocial Support",
        option: "Option 2 (2 Units)",
        reasoning:
          "Basic trauma-informed services - War-affected children often show PTSD symptoms and concentration issues. Countries like Sweden and the Netherlands have embedded school counselors or mobile therapists. A basic tier of psychosocial support, such as safe spaces and trained school staff, significantly improves academic and emotional outcomes. Tradeoff: More advanced needs may still be unmet.",
      },
      {
        factor: "5. Curriculum Adaptation",
        option: "Option 2 (2 Units)",
        reasoning:
          "Blend national and refugee-relevant content - Lebanon and Turkey experimented with hybrid curricula – maintaining host standards while incorporating refugee history and civic elements. This reduces alienation while maintaining national benchmarks. The OECD promotes curriculum pluralism for refugee resilience. Tradeoff: Requires careful balancing and political will.",
      },
      {
        factor: "6. Certification & Exams",
        option: "Option 1 (1 Unit)",
        reasoning:
          "Minimal recognition of prior learning - While not ideal, many refugees lack verifiable transcripts. Uganda and Greece have used assessment-based placement or bridge programs, which are cost-effective. Formal equivalency systems are ideal but complex. This option reflects a practical first step. Tradeoff: May limit higher education pathways without reform.",
      },
      {
        factor: "7. Parental Involvement",
        option: "Option 1 (1 Unit)",
        reasoning:
          "Minimal parental involvement - Many refugee parents face language, work, or trauma-related barriers to school participation. Early efforts should focus on building trust. Kenya's Dadaab camps showed that light-touch engagement (e.g., translated notes, parent visits) worked better than formal councils. Over time, this can evolve into more structured inclusion. Tradeoff: Slower path to full family integration in school decisions.",
      },
    ],
  }

  const getTabContent = () => {
    return educationIdealContent
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl" id="ideal-policies-content">
      <h1 className="text-3xl font-bold mb-6 text-center">Ideal Policy Positions</h1>
      <p className="text-lg mb-8 text-center">
        These are the ideal policy positions for the Republic of Bean, based on careful analysis and consideration of
        all perspectives.
      </p>

      <div className="mb-8">
        <h2 className="text-2xl font-bold">Education</h2>
      </div>

      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-2xl">{educationIdealContent.title}</CardTitle>
          <CardDescription className="text-lg">{educationIdealContent.description}</CardDescription>
        </CardHeader>
        <CardContent className="bg-white text-black">
          <div className="prose max-w-none">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary/20">
                  <th className="border border-primary/30 p-2 text-left font-bold text-black">Policy Factor</th>
                  <th className="border border-primary/30 p-2 text-left font-bold text-black">Selected Option</th>
                  <th className="border border-primary/30 p-2 text-left font-bold text-black">
                    Reasoning & Real-Life Examples
                  </th>
                </tr>
              </thead>
              <tbody>
                {educationIdealContent.content.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}>
                    <td className="border border-primary/30 p-2 font-medium text-black">{item.factor}</td>
                    <td className="border border-primary/30 p-2 text-black">{item.option}</td>
                    <td className="border border-primary/30 p-2 whitespace-pre-line text-black">{item.reasoning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between">
        <Link href="/summary">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Summary
          </Button>
        </Link>
        <PDFExport
          filename="republic-of-bean-ideal-policies.pdf"
          content={() => document.getElementById("ideal-policies-content") || document.body}
        >
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export as PDF
          </Button>
        </PDFExport>
        <Link href="/final-feedback">
          <Button>
            Continue to Final Feedback <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
