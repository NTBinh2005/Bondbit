// context/AppContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react'

type Habit = {
  id: number
  name: string
  description?: string
  frequency: string
  currentStreak: number
  lastCheckIn?: string
}

type Partnership = {
  id: number
  requesterId: number
  requesterName: string
  receiverId: number
  receiverName: string
  habitName: string
  status: string
  sharedStreak: number
}

type AppState = {
  habits: Habit[]
  partnerships: Partnership[]
  habitsLoaded: boolean      // đã fetch lần đầu chưa
  partnershipsLoaded: boolean
}

type Action =
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'SET_PARTNERSHIPS'; payload: Partnership[] }
  | { type: 'UPDATE_HABIT_CHECKIN'; habitId: number; streak: number; date: string }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'REMOVE_HABIT'; habitId: number }
  | { type: 'CLEAR' } // Dùng khi logout

const initialState: AppState = {
  habits: [],
  partnerships: [],
  habitsLoaded: false,
  partnershipsLoaded: false,
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_HABITS':
      return { ...state, habits: action.payload, habitsLoaded: true }

    case 'SET_PARTNERSHIPS':
      return { ...state, partnerships: action.payload, partnershipsLoaded: true }

    case 'UPDATE_HABIT_CHECKIN':
      return {
        ...state,
        habits: state.habits.map(h =>
          h.id === action.habitId
            ? { ...h, currentStreak: action.streak, lastCheckIn: action.date }
            : h
        )
      }

    case 'ADD_HABIT':
      return { ...state, habits: [action.payload, ...state.habits] }

    case 'REMOVE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.habitId) }

    case 'CLEAR':
      return initialState

    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}