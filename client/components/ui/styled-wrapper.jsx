import * as React from "react"
import { cn } from "@/lib/utils"

const StyledWrapper = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-full overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
StyledWrapper.displayName = "StyledWrapper"

export { StyledWrapper } 