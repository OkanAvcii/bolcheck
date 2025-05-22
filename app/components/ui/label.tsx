"use client"

import * as React from "react"

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (props, ref) => {
    return <label ref={ref} {...props} />
  }
)
Label.displayName = "Label"

export { Label } 