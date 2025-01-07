import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const setWidth = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    setWidth()
    return () => {}
  }, [])

  return !!isMobile
}
