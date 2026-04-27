// MET values for common exercises
export const EXERCISE_TYPES = [
  { label: 'ウォーキング（普通）', met: 3.5 },
  { label: 'ウォーキング（速歩）', met: 4.5 },
  { label: 'ジョギング', met: 7.0 },
  { label: 'ランニング', met: 10.0 },
  { label: '自転車（普通）', met: 6.0 },
  { label: '水泳', met: 8.0 },
  { label: '筋力トレーニング（軽い）', met: 3.0 },
  { label: '筋力トレーニング（中程度）', met: 5.0 },
  { label: '筋力トレーニング（激しい）', met: 6.0 },
  { label: 'ヨガ', met: 2.5 },
  { label: 'ストレッチ', met: 2.0 },
  { label: 'サッカー', met: 8.0 },
  { label: 'バスケットボール', met: 8.0 },
  { label: 'テニス', met: 7.0 },
  { label: 'HIIT', met: 10.0 },
  { label: 'その他（軽い）', met: 3.0 },
  { label: 'その他（中程度）', met: 5.0 },
  { label: 'その他（激しい）', met: 8.0 },
]

// calories burned = MET × weight(kg) × duration(hours)
export const calcExerciseCalories = (met, weightKg, durationMin) => {
  return Math.round(met * weightKg * (durationMin / 60))
}

// Work calorie expenditure per hour above resting (rough estimates)
const WORK_KCAL_PER_HOUR = {
  sedentary: 80,   // desk work
  light: 150,      // standing/light movement
  moderate: 250,   // physical work, light labor
}

export const calcWorkCalories = (workHoursPerDay, workDaysPerWeek, workType) => {
  const dayFraction = workDaysPerWeek / 7
  const perHour = WORK_KCAL_PER_HOUR[workType] ?? 80
  return Math.round(perHour * workHoursPerDay * dayFraction)
}

// TDEE = BMR × activity multiplier (excluding explicit exercise)
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
}

export const calcTDEE = (bmr, workType) => {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[workType] ?? 1.2))
}

export const WORK_TYPE_LABELS = {
  sedentary: '座り仕事（デスクワーク中心）',
  light: '軽活動（立ち仕事・軽い移動あり）',
  moderate: '中程度活動（現場仕事・肉体労働）',
}

export const todayStr = () => new Date().toISOString().slice(0, 10)

export const filterByDate = (list, date) =>
  list.filter((e) => e.date === date)

export const sumCalories = (list) =>
  list.reduce((s, e) => s + (e.calories || 0), 0)
