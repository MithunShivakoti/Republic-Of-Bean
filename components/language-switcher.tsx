"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

const languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "ar", name: "العربية" },
]

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState("en")

  const handleLanguageChange = (code: string) => {
    setCurrentLanguage(code)
    // In a real app, you would update the app's language context/state here
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-100">
          <Globe className="h-4 w-4" />
          <span>{languages.find((lang) => lang.code === currentLanguage)?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="dark-card border-primary/30">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`${currentLanguage === language.code ? "bg-primary/20" : ""}`}
          >
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
