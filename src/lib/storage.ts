import type { Session } from '../engine/sessionReducer'

export const ACTIVE_SESSION_STORAGE_KEY = 'orixe-active-session'

function getStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage
}

export function save(key: string, value: unknown) {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn('storage save failed', error)
  }
}

export function load<T>(key: string): T | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  try {
    const value = storage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch (error) {
    console.warn('storage load failed', error)
    return null
  }
}

export function remove(key: string) {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    storage.removeItem(key)
  } catch (error) {
    console.warn('storage remove failed', error)
  }
}

export function saveActiveSession(session: Session) {
  save(ACTIVE_SESSION_STORAGE_KEY, session)
}

export function loadActiveSession(): Session | null {
  return load<Session>(ACTIVE_SESSION_STORAGE_KEY)
}

export function clearActiveSession() {
  remove(ACTIVE_SESSION_STORAGE_KEY)
}
