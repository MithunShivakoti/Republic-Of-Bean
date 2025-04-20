export interface ExtendedAgentProfile {
  id: string
  name: string
  role: string
  avatar: string
  fullBio: string
  background: string
  values: string[]
  approach: string
  expertise: string[]
  quote: string
}

// Update the extended profiles to match the new roles
const extendedAgentProfiles: ExtendedAgentProfile[] = [
  {
    id: "agent1",
    name: "Dr. Selina Moreau",
    role: "Education Specialist",
    avatar: "🧠",
    fullBio:
      "An experienced curriculum designer with UNESCO, Dr. Moreau has worked in multiple crisis zones creating adaptive education systems for displaced populations.",
    background:
      "She has contributed to policy reform in Lebanon and Jordan's integration of Syrian refugee children. Her work focuses on creating sustainable education models that can be implemented in resource-constrained environments.",
    values: ["Evidence-based approaches", "Innovation", "Educational equity", "Sustainable development"],
    approach:
      "Dr. Moreau analyzes education policies through both pragmatic and innovative lenses, sometimes advocating for bold new approaches when traditional methods have failed in similar contexts.",
    expertise: [
      "Curriculum design for crisis contexts",
      "Teacher training",
      "Educational policy reform",
      "Multilingual education",
    ],
    quote: "Education is not just about learning; it's about creating pathways to dignity and self-determination.",
  },
  {
    id: "agent2",
    name: "Aisha Tarek",
    role: "Refugee (Syrian, 16 years old)",
    avatar: "🧳",
    fullBio:
      "Aisha fled civil war with her family and has lived in 3 refugee camps. She is determined to pursue higher education and advocates for her peers who have experienced interrupted schooling.",
    background:
      "Aisha speaks Arabic and is learning Teanish. Despite missing several years of formal education, she has been studying independently and helping younger children in the camps with their schoolwork.",
    values: ["Educational opportunity", "Youth empowerment", "Cultural identity", "Radical change"],
    approach:
      "Aisha brings the crucial perspective of refugee students themselves, sometimes advocating for complete system overhauls when she feels incremental changes won't address fundamental barriers to education.",
    expertise: ["Peer education", "Language acquisition challenges", "Educational disruption", "Youth advocacy"],
    quote:
      "We don't just need schools; we need schools that understand what we've been through and where we want to go.",
  },
  {
    id: "agent3",
    name: "Luca Demir",
    role: "Social Worker",
    avatar: "🧑‍⚕️",
    fullBio:
      "Luca has worked with international NGOs supporting refugee families in Eastern Europe, North Africa, and Central America.",
    background:
      "He specializes in child trauma recovery, reintegration into society, and bridging gaps between policy and reality. His field experience gives him insight into the practical challenges of implementing education policies in diverse contexts.",
    values: ["Trauma-informed care", "Family-centered approaches", "Holistic support systems", "Experimental methods"],
    approach:
      "Luca evaluates policies based on their psychological impact and practical implementation challenges. He occasionally supports unconventional or experimental approaches when traditional methods have proven insufficient.",
    expertise: [
      "Trauma-informed education",
      "Family support systems",
      "Psychosocial interventions",
      "Community-based programs",
      "Cross-cultural communication",
    ],
    quote:
      "Education policy must recognize that learning cannot happen until basic psychological safety is established.",
  },
  {
    id: "agent4",
    name: "Omar Al-Kazemi",
    role: "Refugee (former teacher, 42 years old)",
    avatar: "🌍",
    fullBio:
      "Omar was a science teacher before displacement and now volunteers teaching youth in makeshift classrooms.",
    background:
      "He is a strong advocate for adult education and the preservation of cultural identity through mother tongue education. His experience as both an educator and a refugee gives him unique insight into the challenges of teaching in crisis contexts.",
    values: ["Cultural preservation", "Mother tongue education", "Teacher empowerment", "Revolutionary thinking"],
    approach:
      "Omar brings a practical educator's perspective, but is not afraid to advocate for complete system overhauls when he believes current approaches are fundamentally flawed. He can be quite passionate about dramatic reforms.",
    expertise: [
      "Science education",
      "Teacher training",
      "Multilingual instruction",
      "Adult education",
      "Informal learning environments",
    ],
    quote:
      "When we teach refugees in their mother tongue while helping them learn new languages, we honor their past while building their future.",
  },
]

export default extendedAgentProfiles
