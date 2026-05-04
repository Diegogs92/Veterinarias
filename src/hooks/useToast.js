import { useState, useCallback } from 'react'

export function useToast(duration = 3000) {
  const [toast, setToast] = useState(null) // { message, type }

  const showToast = useCallback((message, type = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [duration])

  return { toast, showToast }
}
