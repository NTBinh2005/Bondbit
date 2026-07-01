// hooks/usePartnerships.ts
import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import api from '../services/api'

export function usePartnerships() {
  const { state, dispatch } = useAppContext()

  const fetchPartnerships = useCallback(async (force = false) => {
    if (state.partnershipsLoaded && !force) return

    const res = await api.get('/api/partnerships/mine')
    dispatch({ type: 'SET_PARTNERSHIPS', payload: res.data })
  }, [state.partnershipsLoaded])

  return {
    partnerships: state.partnerships,
    partnershipsLoaded: state.partnershipsLoaded,
    fetchPartnerships,
    // Force refresh khi cần (accept/reject invitation)
    refreshPartnerships: () => fetchPartnerships(true)
  }
}