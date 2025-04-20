export interface AgentProfile {
  id: string
  name: string
  role: string
  avatar: string
  shortBio: string
  specialty: string
  perspective: string
}

const agentProfiles: AgentProfile[] = [
  {
    id: "agent1",
    name: "Dr. Selina Moreau",
    role: "Education Specialist",
    avatar: "🧠",
    shortBio:
      "An experienced curriculum designer with UNESCO, worked in multiple crisis zones creating adaptive education systems for displaced populations.",
    specialty: "Adaptive Education Systems",
    perspective: "Evidence-Based & Innovative",
  },
  {
    id: "agent2",
    name: "Aisha Tarek",
    role: "Refugee (Syrian, 16 years old)",
    avatar: "🧳",
    shortBio: "Fled civil war with her family, lived in 3 refugee camps, determined to pursue higher education.",
    specialty: "Student Experience",
    perspective: "Youth-Centered & Revolutionary",
  },
  {
    id: "agent3",
    name: "Luca Demir",
    role: "Social Worker",
    avatar: "🧑‍⚕️",
    shortBio:
      "Worked with international NGOs supporting refugee families in Eastern Europe, North Africa, and Central America.",
    specialty: "Child Trauma Recovery",
    perspective: "Trauma-Informed & Experimental",
  },
  {
    id: "agent4",
    name: "Omar Al-Kazemi",
    role: "Refugee (former teacher, 42 years old)",
    avatar: "🌍",
    shortBio: "Former science teacher before displacement, now volunteers teaching youth in makeshift classrooms.",
    specialty: "Cultural Preservation",
    perspective: "Cultural Preservation & Radical Reform",
  },
]

export default agentProfiles
