import React, { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  calcTDEE, calcWorkCalories, filterByDate, sumCalories, todayStr,
} from '../utils/calories'
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'

export default function Dashboard({ onNav }) {
  const { settings, bodyMetrics, meals, exercises } = useApp()
  const today = todayStr()

  const latestMetric = useMemo(() => {
    if (!bodyMetrics.length) return null
    return bodyMetrics[bodyMetrics.length - 1]
  }, [bodyMetrics])

  const todayMeals = filterByDate(meals, today)
  const todayExercises = filterByDate(exercises, today)
  const intakeKcal = sumCalories(todayMeals)
  const exerciseKcal = sumCalories(todayExercises)

  const bmr = latestMetric?.bmr || 0
  const weight = latestMetric?.weight || Number(settings.height || 0) * 0.22

  const tdee = bmr ? calcTDEE(bmr, settings.workType) : 0
  const workKcal = bmr
    ? calcWorkCalories(settings.workHoursPerDay, settings.workDaysPerWeek, settings.workType)
    : 0
  const totalBurn = tdee + exerciseKcal
  const balance = intakeKcal - totalBurn

  const progressPct = totalBurn > 0 ? Math.min(100, Math.round((intakeKcal / totalBurn) * 100)) : 0

  // Weight trend (last 14 days)
  const weightTrend = useMemo(() => {
    return bodyMetrics.slice(-14).map((m) => ({
      date: m.date.slice(5),
      weight: m.weight,
    }))
  }, [bodyMetrics])

  return (
    <div className="fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">💪 BodyMake</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        {latestMetric && (
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{latestMetric.weight}<span className="text-base font-normal text-gray-500"> kg</span></div>
            {settings.targetWeight && (
              <div className="text-xs text-gray-500">目標まで {(latestMetric.weight - settings.targetWeight).toFixed(1)} kg</div>
            )}
          </div>
        )}
      </div>

      {!latestMetric && (
        <div className="card text-center py-6 text-gray-500">
          <p className="text-3xl mb-2">⚖️</p>
          <p>体組成データがありません</p>
          <button className="btn-accent mt-3 text-sm" onClick={() => onNav('body')}>体組成を入力する</button>
        </div>
      )}

      {/* Calorie balance */}
      <div className="card">
        <h2 className="font-bold text-gray-700 mb-3">今日のカロリーバランス</h2>
        <div className="flex items-center gap-4">
          {/* Radial progress */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="65%" outerRadius="90%"
                startAngle={90} endAngle={90 - 360 * (progressPct / 100)}
                data={[{ value: progressPct, fill: progressPct > 110 ? '#ef4444' : '#14b8a6' }]}
              >
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f0fdf4' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{progressPct}%</span>
              <span className="text-[9px] text-gray-500">摂取/消費</span>
            </div>
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <Row label="🍱 摂取" val={intakeKcal} unit="kcal" color="text-orange-500" />
            <Row label="🔥 基礎×活動" val={tdee} unit="kcal" color="text-gray-500" />
            <Row label="💼 仕事" val={workKcal} unit="kcal" color="text-gray-500" />
            <Row label="🏃 運動" val={exerciseKcal} unit="kcal" color="text-teal-500" />
            <div className="border-t pt-2">
              <Row
                label="📊 差引"
                val={balance > 0 ? `+${balance}` : balance}
                unit="kcal"
                color={balance > 0 ? 'text-red-500' : 'text-teal-600'}
                bold
              />
            </div>
          </div>
        </div>
      </div>

      {/* Body metrics summary */}
      {latestMetric && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">最新の体組成</h2>
            <span className="text-xs text-gray-400">{latestMetric.date}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="体脂肪率" val={latestMetric.bodyFatPercent} unit="%" badge={latestMetric.bodyFatBadge} />
            <Metric label="筋肉量" val={latestMetric.muscleMass} unit="kg" badge="標準" />
            <Metric label="BMI" val={latestMetric.bmi} unit="" badge={latestMetric.bmiBadge} />
            <Metric label="内臓脂肪" val={latestMetric.visceralFatLevel} unit="" />
            <Metric label="基礎代謝" val={latestMetric.bmr} unit="kcal" />
            <Metric label="体内年齢" val={latestMetric.bodyAge} unit="才" />
          </div>
          <button className="btn-outline w-full mt-3 text-sm" onClick={() => onNav('body')}>
            更新する
          </button>
        </div>
      )}

      {/* Weight trend chart */}
      {weightTrend.length >= 2 && (
        <div className="card">
          <h2 className="font-bold text-gray-700 mb-3">体重推移</h2>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={weightTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v} kg`, '体重']} />
              <Line type="monotone" dataKey="weight" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
              {settings.targetWeight && (
                <Line
                  type="monotone"
                  data={weightTrend.map((d) => ({ ...d, target: Number(settings.targetWeight) }))}
                  dataKey="target"
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <QuickBtn icon="🍱" label="食事を記録" onClick={() => onNav('meals')} />
        <QuickBtn icon="🏃" label="運動を記録" onClick={() => onNav('exercise')} />
        <QuickBtn icon="⚖️" label="体重を記録" onClick={() => onNav('body')} />
      </div>
    </div>
  )
}

function Row({ label, val, unit, color, bold }) {
  return (
    <div className={`flex justify-between items-center text-sm gap-1 ${bold ? 'font-bold' : ''}`}>
      <span className="text-gray-600 whitespace-nowrap">{label}</span>
      <span className={`${color} whitespace-nowrap`}>{val} <span className="text-xs text-gray-400">{unit}</span></span>
    </div>
  )
}

function Metric({ label, val, unit, badge }) {
  if (!val && val !== 0) return null
  return (
    <div className="bg-gray-50 rounded-xl p-2">
      <div className="text-lg font-bold text-gray-800">{val}<span className="text-xs font-normal text-gray-500">{unit}</span></div>
      <div className="text-xs text-gray-500">{label}</div>
      {badge && <span className="text-[10px] bg-accent text-white rounded px-1">{badge}</span>}
    </div>
  )
}

function QuickBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card flex flex-col items-center gap-1 py-4 active:bg-gray-50 transition-colors text-center"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </button>
  )
}
