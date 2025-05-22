"use client"

import * as React from "react"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = "default", ...props }, ref) => {
    const styles = {
      default: {
        backgroundColor: "#f0fdf4",
        borderColor: "#86efac",
        color: "#16a34a"
      },
      destructive: {
        backgroundColor: "#fee2e2",
        borderColor: "#fca5a5",
        color: "#b91c1c"
      }
    }

    const currentStyle = variant === "destructive" ? styles.destructive : styles.default

    return (
      <div
        ref={ref}
        role="alert"
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${currentStyle.borderColor}`,
          backgroundColor: currentStyle.backgroundColor,
          color: currentStyle.color,
          ...props.style
        }}
        {...props}
      >
        {props.children}
      </div>
    )
  }
)
Alert.displayName = "Alert"

type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  (props, ref) => (
    <h5
      ref={ref}
      style={{
        fontWeight: '600',
        lineHeight: '1.5',
        marginTop: 0,
        marginBottom: '4px'
      }}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  (props, ref) => (
    <p
      ref={ref}
      style={{
        lineHeight: '1.5',
        margin: 0
      }}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription } 