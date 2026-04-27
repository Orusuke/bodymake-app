import React, { createContext, useContext, useState, useCallback } from 'react'
import { storage } from '../utils/storage'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [settings, setSettingsState] = useState(() => storage.getSettings())
  const [bodyMetrics, setBodyMetrics] = useState(() => storage.getBodyMetrics())
  const [meals, setMeals] = useState(() => storage.getMeals())
  const [exercises, setExercises] = useState(() => storage.getExercises())

  const saveSettings = useCallback((s) => {
    storage.saveSettings(s)
    setSettingsState(s)
  }, [])

  const addBodyMetric = useCallback((entry) => {
    storage.addBodyMetric(entry)
    setBodyMetrics(storage.getBodyMetrics())
  }, [])

  const addMeal = useCallback((entry) => {
    storage.addMeal(entry)
    setMeals(storage.getMeals())
  }, [])

  const deleteMeal = useCallback((id) => {
    storage.deleteMeal(id)
    setMeals(storage.getMeals())
  }, [])

  const addExercise = useCallback((entry) => {
    storage.addExercise(entry)
    setExercises(storage.getExercises())
  }, [])

  const deleteExercise = useCallback((id) => {
    storage.deleteExercise(id)
    setExercises(storage.getExercises())
  }, [])

  return (
    <AppContext.Provider value={{
      settings, saveSettings,
      bodyMetrics, addBodyMetric,
      meals, addMeal, deleteMeal,
      exercises, addExercise, deleteExercise,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
