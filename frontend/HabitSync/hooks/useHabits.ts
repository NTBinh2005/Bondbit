// hooks/useHabits.ts
import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import api from '../services/api'

export function useHabits() {
  const { state, dispatch } = useAppContext()

  const fetchHabits = useCallback(async (force = false) => {
    // Chỉ fetch nếu chưa load hoặc bị force refresh
    if (state.habitsLoaded && !force) return

    const res = await api.get('/api/habits')
    dispatch({ type: 'SET_HABITS', payload: res.data })
  }, [state.habitsLoaded])

  const checkIn = async (habitId: number) => {
    const res = await api.post(`/api/habits/${habitId}/check-in`)
    const today = new Date().toISOString().split('T')[0]
    dispatch({
      type: 'UPDATE_HABIT_CHECKIN',
      habitId,
      streak: res.data.newStreak,
      date: today
    })
    return res.data
  }

  const deleteHabit = async (habitId: number) => {
    await api.delete(`/api/habits/${habitId}`)
    dispatch({ type: 'REMOVE_HABIT', habitId })
    // Force refresh partnerships vì backend đã cascade update
    dispatch({ type: 'SET_PARTNERSHIPS', payload: [] }) // reset để fetch lại
  }

  return {
    habits: state.habits,
    habitsLoaded: state.habitsLoaded,
    fetchHabits,
    checkIn,
    deleteHabit
  }
}