export type AgentProfile = {
  id: string
  name: string
  role: string
  origin: string
  background: string
  perspective: string
  specialty?: string
  shortBio?: string
  avatarUrl: string
}

export const allAgentProfiles: AgentProfile[] = [
  {
    id: "fatima",
    name: "Fatima Al-Saleh",
    role: "Refugee",
    origin: "Aleppo, Syria",
    background:
      "Displaced in 2015 during Syrian Civil War at age 14. Faced interrupted education, language barriers in Turkey, and PTSD.",
    perspective:
      "Deeply values equal access and bilingual instruction. Felt isolated when placed in a Turkish-only classroom without support.",
    specialty: "Bilingual Education",
    shortBio: "Former refugee student who experienced educational disruption and language barriers firsthand.",
    avatarUrl: "/agents/fatima.png",
  },
  {
    id: "markus",
    name: "Prof. Markus Neumann",
    role: "Curriculum Expert",
    origin: "Germany",
    background: "Oversaw integration of Syrian refugees into German schools post-2016.",
    perspective:
      "Advocates for adapted curricula and trauma-informed teaching. Led textbook revisions and community teaching forums.",
    specialty: "Curriculum Development",
    shortBio: "Education professor specializing in curriculum adaptation for refugee students.",
    avatarUrl: "/agents/markus.png",
  },
  {
    id: "aminata",
    name: "Aminata Diouf",
    role: "Refugee",
    origin: "Côte d'Ivoire",
    background:
      "Displaced in 2004 during civil conflict at age 11. No official transcripts, moved across 3 countries before stability in Ghana.",
    perspective: "Supports assessment-based recognition after experiencing educational disruption.",
    specialty: "Educational Assessment",
    shortBio: "Former refugee who navigated multiple education systems without proper documentation.",
    avatarUrl: "/agents/aminata.png",
  },
  {
    id: "carla",
    name: "Dr. Carla Jimenez",
    role: "Psychologist in Refugee Camps",
    origin: "Colombia",
    background: "Worked with displaced Venezuelan youth in Bogotá.",
    perspective:
      "Strong advocate for psychosocial services in schools, citing drastic improvements in behavioral issues.",
    specialty: "Trauma-Informed Education",
    shortBio: "Psychologist with extensive experience working with traumatized refugee children.",
    avatarUrl: "/agents/carla.png",
  },
  {
    id: "layla",
    name: "Layla Haddad",
    role: "Refugee mother",
    origin: "Palestine",
    background:
      "Displaced in 2009 during conflict in Gaza at age 35. Struggled to advocate for her child in a foreign school system in Jordan.",
    perspective: "Emphasizes the importance of accessible parent-teacher communication in refugee education.",
    specialty: "Parent Engagement",
    shortBio: "Refugee mother who has navigated foreign education systems for her children.",
    avatarUrl: "/agents/layla.png",
  },
  {
    id: "samuel",
    name: "Samuel Okeke",
    role: "Refugee Education Officer (UNHCR)",
    origin: "Nigeria",
    background: "Led schooling programs in Kakuma camp, Kenya.",
    perspective: "Supports flexible certification models and in-camp teacher development programs.",
    specialty: "Teacher Training",
    shortBio: "UNHCR education officer with experience implementing refugee education programs.",
    avatarUrl: "/agents/samuel.png",
  },
  {
    id: "roya",
    name: "Roya Kaviani",
    role: "Refugee (Former English teacher)",
    origin: "Iran",
    background:
      "Displaced in 2010 due to political exile at age 38. Struggled to find teaching employment without recognized certification.",
    perspective: "Advocates for recognition of professional qualifications across borders.",
    specialty: "Teacher Certification",
    shortBio: "Former teacher who faced barriers to professional recognition as a refugee.",
    avatarUrl: "/agents/roya.png",
  },
  {
    id: "teresa",
    name: "Teresa Alvarez",
    role: "Primary School Teacher",
    origin: "Spain",
    background: "Taught both Spanish and refugee students in Barcelona.",
    perspective:
      "Emphasizes simple classroom integration methods: language buddies, visual aids, and inclusive routines.",
    specialty: "Classroom Integration",
    shortBio: "Primary school teacher with experience integrating refugee students into mainstream classrooms.",
    avatarUrl: "/agents/teresa.png",
  },
  {
    id: "jacob",
    name: "Jacob Mensah",
    role: "Digital Learning Specialist",
    origin: "Ghana",
    background: "Introduced low-cost e-learning platforms for refugees in Uganda & Ethiopia.",
    perspective: "Strong proponent of mobile-based certification and learning where teachers are scarce.",
    specialty: "Educational Technology",
    shortBio: "EdTech specialist focused on digital solutions for refugee education.",
    avatarUrl: "/agents/jacob.png",
  },
  {
    id: "noor",
    name: "Noor Al-Khamees",
    role: "Refugee Youth Advocate",
    origin: "Iraq",
    background:
      "Displaced in 2007 during post-invasion conflict at age 17. Now a legal advocate for refugee education rights in the US.",
    perspective: "Believes in systems that not only admit refugees but believe in their potential.",
    specialty: "Education Rights",
    shortBio: "Former refugee who now advocates for educational rights of displaced youth.",
    avatarUrl: "/agents/noor.png",
  },
  {
    id: "jose",
    name: "José Andres Nuñez",
    role: "Refugee (Rural youth)",
    origin: "El Salvador",
    background:
      "Displaced in 1991 during post-civil war unrest at age 13. Fled with no documents; relocated to Honduras with no formal schooling.",
    perspective: "Prefers vocational programs over formal curriculum in refugee settings.",
    specialty: "Vocational Training",
    shortBio: "Former refugee who benefited from practical skills training rather than formal education.",
    avatarUrl: "/agents/jose.png",
  },
  {
    id: "zainab",
    name: "Zainab Mahamat",
    role: "Refugee (Teen girl)",
    origin: "Chad",
    background:
      "Displaced in 2008 due to border violence near Sudan at age 15. Limited access to education due to gender norms in camps.",
    perspective: "Strong advocate for girl-focused policies and trauma support.",
    specialty: "Gender Equity",
    shortBio: "Former refugee who experienced gender-based educational barriers in displacement.",
    avatarUrl: "/agents/zainab.png",
  },
  {
    id: "helena",
    name: "Helena Weiss",
    role: "Art Therapist & Volunteer Educator",
    origin: "Austria",
    background: "Supported Bosnian refugee children during 1990s Balkans conflict.",
    perspective: "Focuses on healing through creativity and project-based learning for traumatized youth.",
    specialty: "Arts Education",
    shortBio: "Art therapist who has worked with traumatized refugee children across Europe.",
    avatarUrl: "/agents/helena.png",
  },
  {
    id: "bashir",
    name: "Bashir Abdullahi",
    role: "Former Refugee, Now NGO Director",
    origin: "Somalia",
    background:
      "Displaced in 1994 during civil war at age 10. Now heads an NGO supporting Somali youth in Kenya's Dadaab camp.",
    perspective: "Believes in giving back to refugee communities through education.",
    specialty: "Community-Based Education",
    shortBio: "Former refugee who now leads educational initiatives in the same camp where he grew up.",
    avatarUrl: "/agents/bashir.png",
  },
  {
    id: "anika",
    name: "Anika Sato",
    role: "Policy Analyst at UNESCO",
    origin: "Japan",
    background: "Works on comparative education systems for displaced populations.",
    perspective: "Emphasizes scalable, data-backed models for low-income countries.",
    specialty: "Evidence-Based Policy",
    shortBio: "UNESCO policy analyst specializing in refugee education systems worldwide.",
    avatarUrl: "/agents/anika.png",
  },
  {
    id: "musa",
    name: "Musa Diallo",
    role: "Refugee (Skilled adult worker)",
    origin: "Mali",
    background: "Displaced in 2012 during Tuareg rebellion at age 33. No recognition of prior vocational skills.",
    perspective: "Pushes for certification equivalency and adult education options.",
    specialty: "Adult Education",
    shortBio: "Skilled worker who faced barriers to professional recognition as a refugee.",
    avatarUrl: "/agents/musa.png",
  },
  {
    id: "linda",
    name: "Linda Okonjo",
    role: "Tech Educator in Refugee Contexts",
    origin: "Kenya",
    background: "Implements e-learning platforms in camps across East Africa.",
    perspective: "Supports hybrid learning & digital certification for flexibility.",
    specialty: "Digital Learning",
    shortBio: "Educational technologist implementing digital solutions in refugee camps.",
    avatarUrl: "/agents/linda.png",
  },
  {
    id: "eva",
    name: "Eva Klein",
    role: "WWII Refugee Survivor",
    origin: "Hungary",
    background:
      "Displaced in 1944 during Nazi occupation at age 9. Resettled in Canada, placed in regular school without support.",
    perspective: "Education advocate for displaced elderly and intergenerational learners.",
    specialty: "Historical Perspective",
    shortBio: "WWII refugee survivor who has witnessed the evolution of refugee education over decades.",
    avatarUrl: "/agents/eva.png",
  },
  {
    id: "jean",
    name: "Jean-Paul Lambert",
    role: "Headmaster of Integration School",
    origin: "France",
    background: "Oversaw school integration of North African and Middle Eastern refugees.",
    perspective: "Supports multilingual immersion and peer buddy systems.",
    specialty: "School Administration",
    shortBio: "School administrator with extensive experience integrating refugee students.",
    avatarUrl: "/agents/jean.png",
  },
  {
    id: "nasreen",
    name: "Nasreen El-Zein",
    role: "Legal Expert on Refugee Rights",
    origin: "Lebanon",
    background: "Works with UNHCR to fight for certification and legal documentation access.",
    perspective: "Strong stance on formalizing refugee education credentials.",
    specialty: "Educational Documentation",
    shortBio: "Legal expert specializing in educational documentation for refugees.",
    avatarUrl: "/agents/nasreen.png",
  },
]

// Add default export
export default allAgentProfiles
