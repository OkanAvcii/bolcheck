"use client"

import * as React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    // Bütün props'ları doğrudan button elementine aktarıyoruz
    // style ve className gibi özellikler korunuyor
    return <button ref={ref} {...props} />
  }
)
Button.displayName = "Button"

export { Button } 