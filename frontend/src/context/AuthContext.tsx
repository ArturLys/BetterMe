import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface User {
  login: string
}

export interface Session {
  token: string
}

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (login: string, password: string) => Promise<{ error: any }>
  signUp: (login: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token') || 'mock-token'
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setSession({ token: savedToken })
    }
    setLoading(false)
  }, [])

  const signIn = async (login: string, password: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: login, password }),
      })

      if (!res.ok) {
        throw new Error('Invalid credentials')
      }

      const text = await res.text()
      let token = 'mock-token'
      try {
        const json = JSON.parse(text)
        if (json.token) token = json.token
        else if (json.jwt) token = json.jwt
        else if (json.accessToken) token = json.accessToken
      } catch (e) {
        if (text && text.trim().length > 0) token = text.trim()
      }

      const userObj = { login }
      setUser(userObj)
      setSession({ token })
      localStorage.setItem('user', JSON.stringify(userObj))
      localStorage.setItem('token', token)

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message } }
    }
  }

  const signUp = async (_login: string, _password: string) => {
    // Hide register for now as requested
    return { error: { message: 'Registration is disabled for now.' } }
  }

  const signOut = async () => {
    setUser(null)
    setSession(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
