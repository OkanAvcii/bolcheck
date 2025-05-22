"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

interface ThemeProviderProps {
  children: React.ReactNode
  [key: string]: React.ReactNode | unknown
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // Sadece istemci tarafında çalıştıktan sonra render işlemini tamamla
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // İlk render sırasında children'ı göster ama tema değişiklikleri uygulanmasın
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 