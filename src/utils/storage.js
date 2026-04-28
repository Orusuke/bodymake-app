const KEYS = {
  settings: 'bm_settings',
  bodyMetrics: 'bm_body_metrics',
  meals: 'bm_meals',
  exercises: 'bm_exercises',
}

const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const defaultSettings = {
  height: '',
  age: '',
  sex: 'male',
  targetWeight: '',
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  workType: 'sedentary',
  openrouterApiKey: '',
}

export const storage = {
  getSettings: () => load(KEYS.settings, defaultSettings),
  saveSettings: (s) => save(KEYS.settings, s),

  getBodyMetrics: () => load(KEYS.bodyMetrics, []),
  saveBodyMetrics: (list) => save(KEYS.bodyMetrics, list),
  addBodyMetric: (entry) => {
    const list = storage.getBodyMetrics()
    const idx = list.findIndex((e) => e.date === entry.date)
    if (idx >= 0) list[idx] = entry
    else list.push(entry)
    list.sort((a, b) => a.date.localeCompare(b.date))
    save(KEYS.bodyMetrics, list)
  },

  getMeals: () => load(KEYS.meals, []),
  saveMeals: (list) => save(KEYS.meals, list),
  addMeal: (entry) => {
    const list = storage.getMeals()
    list.push(entry)
    save(KEYS.meals, list)
  },
  deleteMeal: (id) => {
    const list = storage.getMeals().filter((e) => e.id !== id)
    save(KEYS.meals, list)
  },

  getExercises: () => load(KEYS.exercises, []),
  addExercise: (entry) => {
    const list = storage.getExercises()
    list.push(entry)
    save(KEYS.exercises, list)
  },
  deleteExercise: (id) => {
    const list = storage.getExercises().filter((e) => e.id !== id)
    save(KEYS.exercises, list)
  },
}
