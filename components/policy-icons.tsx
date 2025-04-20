import { GraduationCap, Languages, Brain, DollarSign, School, BookOpen, FileCheck, type LucideIcon } from "lucide-react"

type PolicyIconsProps = {
  policyId: number
  className?: string
}

export function PolicyIcons({ policyId, className }: PolicyIconsProps) {
  const icons: Record<number, LucideIcon> = {
    1: GraduationCap, // Education Access
    2: Languages, // Language Instruction
    3: School, // Teacher Training
    4: BookOpen, // Curriculum
    5: Brain, // Psychosocial Support
    6: DollarSign, // Financial Aid
    7: FileCheck, // Certification
  }

  const Icon = icons[policyId] || GraduationCap

  return <Icon className={className} />
}
