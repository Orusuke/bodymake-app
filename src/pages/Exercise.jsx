import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { analyzeExercise } from '../utils/claude'
import { filterByDate, sumCalories, todayStr } from '../utils/calories'

export default function Exercise() {
  const { exercises, addExercise, deleteExercise, bodyMetrics, settings } = useApp()
  const [date, setDate] = useState(todayStr())
  const [description, setDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState('')
  const [pendingCalories, setPendingCalories] = useState(null)

  const latestMetric = bodyMetrics.length ? bodyMetrics[bodyMetrics.length - 1] : null
  const weight = latestMetric?.weight || 65

  const todayExercises = filterByDate(exercises, date)
  const totalKcal = sumCalories(todayExercises)

  const handleAnalyze = async () => {
    if (!description.trim()) return
    if (!settings.anthropicApiKey) {
      setError('⚠️ 設定でAnthropicのAPIキーを入力してください')
      return
    }
    setAnalyzing(true)
    setError('')
    setAnalysisResult(null)
    try {
      const result = await analyzeExercise(settings.anthropicApiKey, description, weight)
      setAnalysisResult(result)
      setPendingCalories(result.total)
    } catch (e) {
      setError(`エラー: ${e.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAdd = () => {
    if (!pendingCalories && pendingCalories !== 0) return
    addExercise({
      id: crypto.randomUUID(),
      date,
      description,
      calories: pendingCalories,
      analysisItems: analysisResult?.items || [],
      timestamp: new Date().toISOString(),
    })
    setDescription('')
    setAnalysisResult(null)
    setPendingCalories(null)
    setError('')
  }

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🏃 運動記録</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1"
        />
      </div>

      {/* Daily total */}
      <div className="card flex justify-between items-center">
        <span className="text-gray-600 font-medium">本日の運動消費カロリー</span>
        <span className="text-2xl font-bold text-teal-600">{totalKcal} <span className="text-sm font-normal text-gray-400">kcal</span></span>
      </div>

      {/* Add exercise form */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">➕ 運動を追加</h2>

        {!settings.anthropicApiKey && (
          <p className="text-xs text-orange-500 bg-orange-50 rounded-xl p-2">
            ⚠️ 設定でAnthropicのAPIキーを入力するとAI計算が使えます
          </p>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">運動内容を自由に入力</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder={'例:\nジョギング30分\nベンチプレス80kg×10回×3セット、スクワット60kg×12回×3セット\n縄跳び20分、腕立て伏せ50回'}
          />
        </div>

        <button
          className="btn-accent w-full flex items-center justify-center gap-2"
          onClick={handleAnalyze}
          disabled={analyzing || !description.trim()}
        >
          {analyzing ? (
            <><span className="animate-spin">⏳</span> AI計算中...</>
          ) : (
            <>🤖 AIでカロリーを計算</>
          )}
        </button>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{error}</p>
        )}

        {analysisResult && (
          <div className="bg-teal-50 rounded-xl p-3 space-y-2">
            <p className="font-semibold text-teal-700 text-sm">✅ AI計算結果</p>
            {analysisResult.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-700">
                <div>
                  <span>{item.name}</span>
                  <span className="text-gray-400 text-xs ml-1">{item.duration}</span>
                </div>
                <span className="font-medium">{item.calories} kcal</span>
              </div>
            ))}
            <div className="border-t border-teal-200 pt-2 flex justify-between font-bold text-teal-700">
              <span>合計消費カロリー</span>
              <span>{analysisResult.total} kcal</span>
            </div>
            {analysisResult.notes && (
              <p className="text-xs text-gray-500">※ {analysisResult.notes}</p>
            )}

            <div className="pt-1 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">カロリーを修正:</label>
                <input
                  type="number"
                  value={pendingCalories ?? ''}
                  onChange={(e) => setPendingCalories(Number(e.target.value))}
                  className="input-field text-sm py-1"
                />
                <span className="text-xs text-gray-400">kcal</span>
              </div>
              <button className="btn-primary w-full" onClick={handleAdd}>
                記録する
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Exercise log */}
      {todayExercises.length > 0 && (
        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-700">📋 本日の運動</h2>
          {todayExercises.map((ex) => (
            <div key={ex.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 flex-1">{ex.description}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold text-teal-600">{ex.calories}</span>
                  <span className="text-xs text-gray-400">kcal</span>
                  <button
                    className="text-gray-300 hover:text-red-400 text-lg leading-none"
                    onClick={() => deleteExercise(ex.id)}
                  >×</button>
                </div>
              </div>
              {ex.analysisItems?.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {ex.analysisItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-400">
                      <span>{item.name} {item.duration}</span>
                      <span>{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-600">ℹ️ 計算に使用する体重</p>
        <p>体重: {weight} kg {!latestMetric && '（未登録のためデフォルト値）'}</p>
        <p>体組成ページで体重を記録すると計算精度が上がります。</p>
      </div>
    </div>
  )
}
