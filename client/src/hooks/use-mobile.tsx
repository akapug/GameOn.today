
import * as React from "react"

const MOBILE_BREAKPOINT = 768

type MobileContextType = {
  isMobile: boolean
  width: number
}

const MobileContext = React.createContext<MobileContextType | undefined>(undefined)

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<MobileContextType>({
    isMobile: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0
  })

  React.useEffect(() => {
    const handleResize = () => {
      setState({
        isMobile: window.innerWidth < MOBILE_BREAKPOINT,
        width: window.innerWidth
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <MobileContext.Provider value={state}>
      {children}
    </MobileContext.Provider>
  )
}

export function useIsMobile() {
  const context = React.useContext(MobileContext)
  if (context === undefined) {
    throw new Error('useIsMobile must be used within a MobileProvider')
  }
  return context.isMobile
}
