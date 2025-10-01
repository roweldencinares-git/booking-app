'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface MockAuthContextType {
  isSignedIn: boolean
  user: { id: string; email: string; name: string } | null
  signIn: () => void
  signOut: () => void
}

const MockAuthContext = createContext<MockAuthContextType>({
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signOut: () => {}
})

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)

  const signIn = () => {
    setIsSignedIn(true)
    setUser({
      id: 'mock-user-123',
      email: 'test@example.com',
      name: 'Test User'
    })
  }

  const signOut = () => {
    setIsSignedIn(false)
    setUser(null)
  }

  return (
    <MockAuthContext.Provider value={{ isSignedIn, user, signIn, signOut }}>
      {children}
    </MockAuthContext.Provider>
  )
}

export function useMockAuth() {
  return useContext(MockAuthContext)
}

// Mock Clerk components
export function MockSignedIn({ children }: { children: ReactNode }) {
  const { isSignedIn } = useMockAuth()
  return isSignedIn ? <>{children}</> : null
}

export function MockSignedOut({ children }: { children: ReactNode }) {
  const { isSignedIn } = useMockAuth()
  return !isSignedIn ? <>{children}</> : null
}

export function MockSignInButton({ children }: { children: ReactNode }) {
  const { signIn } = useMockAuth()
  return <div onClick={signIn}>{children}</div>
}

export function MockUserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  const { user, signOut } = useMockAuth()

  return (
    <div className="relative inline-block">
      <button
        onClick={signOut}
        className="w-8 h-8 rounded-full bg-primary-teal text-white flex items-center justify-center hover:bg-primary-blue transition-colors"
        title={user?.email}
      >
        {user?.name.charAt(0).toUpperCase()}
      </button>
    </div>
  )
}
