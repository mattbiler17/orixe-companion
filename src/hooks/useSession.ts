import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialSession, type Session } from '../engine/sessionReducer'

type SessionState = {
  session: Session
  setSession: (s: Session) => void
  reset: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      session: initialSession,
      setSession: (s: Session) => set({ session: s }),
      reset: () => set({ session: initialSession }),
    }),
    { name: 'orixe-session' }
  )
)

export default useSession
