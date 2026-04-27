import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { calcTDEE, filterByDate, sumCalories } from '../utils/calories'
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { format, subDays, parseISO, eachDayOfInterval, startOfDay } from 'date-fns'

const PERIODS = [
  { label: '7日', days: 7 },
  { label: '14日', days: 14 },
  { label: '30日', days: 30 },
  { label: '90日', days: 90 },
  { label: '全期間', days: null },
]

export default function Charts() {
  const { bodyMetrics, meals, exercises, settings } = useApp()
  const [period, setPeriod] = useState(30)

  const latestMetric = bodyMetrics.length ? bodyMetrics[bodyMetrics.length - 1] : null
  const bmr = latestMetric?.bmr || 0
  const tdee = bmr ? calcTDEE(bmr, settings.workType) : 0

  // Date range
  const endDate = new Date()
  const startDate = period
    ? subDays(endDate, period - 1)
    : bodyMetrics.length ? parseISO(bodyMetrics[0].date) : subDays(endDate, 30)

  // Body composition data within range
  const bodyData = useMemo(() => {
    return bodyMetrics
      .filter((m) => {
        const d = parseISO(m.date)
        return d >= startOfDay(startDate) && d <= endDate
      })
      .map((m) => ({ ...m, label: m.date.slice(5) }))
  }, [bodyMetrics, period])

  // Calorie data: one entry per day in range
  const calorieData = useMemo(() => {
    const days = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(endDate) })
    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const intake = sumCalories(filterByDate(meals, dateStr))
      const exercise = sumCalories(filterByDate(exercises, dateStr))
      const burn = tdee + exercise
      const balance = intake - burn
      return {
        date: dateStr,
        label: format(day, 'M/d'),
        intake,
        exercise,
        burn: burn || null,
        balance: intake > 0 || exercise > 0 ? balance : null,
      }
    }).filter((d) => d.intake > 0 || d.exercise > 0)
  }, [meals, exercises, period, tdee])

  // Stats
  const stats = useMemo(() => {
    if (!bodyData.length) return null
    const first = bodyData[0]
    const last = bodyData[bodyData.length - 1]
    const avgWeight = bodyData.reduce((s, m) => s + (m.weight || 0), 0) / bodyData.length
    const weightChange = last.weight && first.weight ? last.weight - first.weight : null
    const avgBF = bodyData.filter((m) => m.bodyFatPercent).reduce((s, m, _, a) => s + m.bodyFatPercent / a.length, 0)
    const avgIntake = calorieData.length
      ? calorieData.reduce((s, d) => s + d.intake, 0) / calorieData.filter((d) => d.intake > 0).length
      : 0
    const avgExercise = calorieData.length
      ? calorieData.reduce((s, d) => s + d.exercise, 0) / calorieData.filter((d) => d.exercise > 0).length
      : 0
    return { avgWeight, weightChange, avgBF, avgIntake, avgExercise, days: bodyData.length }
  }, [bodyData, calorieData])

  const hasBody = bodyData.length >= 2
  const hasCalorie = calorieData.length >= 1

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-xl font-bold">📊 グラフ・分析</h1>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPeriod(p.days)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              period === p.days
                ? 'bg-accent text-white border-accent'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="平均体重"
            val={stats.avgWeight.toFixed(1)}
            unit="kg"
            sub={stats.weightChange != null
              ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)} kg 変化`
              : null}
            subColor={stats.weightChange > 0 ? 'text-red-500' : 'text-teal-600'}
          />
          <StatCard
            label="平均体脂肪率"
            val={stats.avgBF ? stats.avgBF.toFixed(1) : '--'}
            unit="%"
          />
          <StatCard
            label="平均摂取カロリー"
            val={stats.avgIntake ? Math.round(stats.avgIntake) : '--'}
            unit="kcal/日"
          />
          <StatCard
            label="平均運動消費"
            val={stats.avgExercise ? Math.round(stats.avgExercise) : '--'}
            unit="kcal/日"
          />
        </div>
      )}

      {!hasBody && !hasCalorie && (
        <div className="card text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">📉</p>
          <p>データがまだありません</p>
          <p className="text-xs mt-1">体組成・食事・運動を記録するとグラフが表示されます</p>
        </div>
      )}

      {/* Weight chart */}
      {hasBody && (
        <ChartCard title="体重推移" unit="kg">
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={bodyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, n) => [`${v} kg`, n]} />
              <Line type="monotone" dataKey="weight" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="体重" />
              {settings.targetWeight && (
                <ReferenceLine y={Number(settings.targetWeight)} stroke="#f97316" strokeDasharray="5 5" label={{ value: `目標 ${settings.targetWeight}kg`, position: 'insideTopRight', fontSize: 10, fill: '#f97316' }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Body fat & muscle chart */}
      {hasBody && bodyData.some((m) => m.bodyFatPercent || m.muscleMass) && (
        <ChartCard title="体脂肪率・筋肉量推移">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={bodyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis yAxisId="fat" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="muscle" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {bodyData.some((m) => m.bodyFatPercent) && (
                <Line yAxisId="fat" type="monotone" dataKey="bodyFatPercent" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="体脂肪率(%)" />
              )}
              {bodyData.some((m) => m.muscleMass) && (
                <Line yAxisId="muscle" type="monotone" dataKey="muscleMass" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="筋肉量(kg)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* BMI chart */}
      {hasBody && bodyData.some((m) => m.bmi) && (
        <ChartCard title="BMI推移">
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={bodyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v}`, 'BMI']} />
              <ReferenceLine y={18.5} stroke="#94a3b8" strokeDasharray="3 3" />
              <ReferenceLine y={25} stroke="#f97316" strokeDasharray="3 3" label={{ value: '25', position: 'right', fontSize: 9, fill: '#f97316' }} />
              <Line type="monotone" dataKey="bmi" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="BMI" />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-1">オレンジ点線: BMI 25（過体重の基準）</p>
        </ChartCard>
      )}

      {/* Calorie intake vs burn */}
      {hasCalorie && (
        <ChartCard title="摂取・消費カロリー" unit="kcal">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={calorieData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={calorieData.length > 14 ? Math.floor(calorieData.length / 7) : 0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, n) => [`${v} kcal`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="intake" name="摂取" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Bar dataKey="exercise" name="運動消費" fill="#14b8a6" radius={[3, 3, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Calorie balance */}
      {hasCalorie && calorieData.some((d) => d.balance != null) && (
        <ChartCard title="カロリー収支（摂取 - 消費）" unit="kcal">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={calorieData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={calorieData.length > 14 ? Math.floor(calorieData.length / 7) : 0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`${v > 0 ? '+' : ''}${v} kcal`, '収支']} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="balance" name="収支" maxBarSize={20} radius={[3, 3, 0, 0]}>
                {calorieData.map((d, i) => (
                  <Cell key={i} fill={d.balance > 0 ? '#ef4444' : '#14b8a6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-1">赤: カロリーオーバー ／ 緑: カロリー不足</p>
        </ChartCard>
      )}

      {/* Visceral fat & bone trend */}
      {hasBody && bodyData.some((m) => m.visceralFatLevel || m.boneMass) && (
        <ChartCard title="内臓脂肪レベル・推定骨量">
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={bodyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis yAxisId="visceral" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <YAxis yAxisId="bone" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {bodyData.some((m) => m.visceralFatLevel) && (
                <Line yAxisId="visceral" type="monotone" dataKey="visceralFatLevel" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="内臓脂肪" />
              )}
              {bodyData.some((m) => m.boneMass) && (
                <Line yAxisId="bone" type="monotone" dataKey="boneMass" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="骨量(kg)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

function ChartCard({ title, unit, children }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700 text-sm">{title}</h2>
        {unit && <span className="text-xs text-gray-400">単位: {unit}</span>}
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, val, unit, sub, subColor }) {
  return (
    <div className="card py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-800">
        {val} <span className="text-xs font-normal text-gray-400">{unit}</span>
      </div>
      {sub && <div className={`text-xs mt-0.5 ${subColor || 'text-gray-400'}`}>{sub}</div>}
    </div>
  )
}
