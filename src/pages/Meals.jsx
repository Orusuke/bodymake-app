import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { analyzeFoodPhoto, analyzeFoodText } from '../utils/claude'
import { filterByDate, sumCalories, todayStr } from '../utils/calories'

const MEAL_TYPES = ['朝食', '昼食', '夕食', 'おやつ', 'その他']

export default function Meals() {
  const { settings, meals, addMeal, deleteMeal } = useApp()
  const [date, setDate] = useState(todayStr())
  const [mealType, setMealType] = useState('昼食')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [inputMode, setInputMode] = useState('text') // 'text' | 'photo'
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const todayMeals = filterByDate(meals, date)
  const totalKcal = sumCalories(todayMeals)

  const resetForm = () => {
    setDescription('')
    setCalories('')
    setPhoto(null)
    setPhotoPreview(null)
    setAnalysisResult(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setAnalysisResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result)
      setPhoto({ dataUrl: ev.target.result, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  const checkApiKey = () => {
    if (!settings.anthropicApiKey) {
      setError('⚠️ 設定でAnthropicのAPIキーを入力してください')
      return false
    }
    return true
  }

  const applyResult = (result) => {
    setAnalysisResult(result)
    setCalories(String(result.total))
    if (!description) {
      setDescription(result.items.map((i) => `${i.name}(${i.amount})`).join('、'))
    }
  }

  const handleAnalyzeText = async () => {
    if (!description.trim() || !checkApiKey()) return
    setAnalyzing(true)
    setError('')
    try {
      applyResult(await analyzeFoodText(settings.anthropicApiKey, description))
    } catch (e) {
      setError(`エラー: ${e.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyzePhoto = async () => {
    if (!photo || !checkApiKey()) return
    setAnalyzing(true)
    setError('')
    try {
      const result = await analyzeFoodPhoto(settings.anthropicApiKey, photo.dataUrl.split(',')[1], photo.mimeType)
      applyResult(result)
    } catch (e) {
      setError(`エラー: ${e.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAdd = () => {
    if (!calories || !mealType) return
    addMeal({
      id: crypto.randomUUID(),
      date,
      mealType,
      description,
      calories: Number(calories),
      timestamp: new Date().toISOString(),
    })
    resetForm()
  }

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🍱 食事記録</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1"
        />
      </div>

      <div className="card flex justify-between items-center">
        <span className="text-gray-600 font-medium">本日の摂取カロリー</span>
        <span className="text-2xl font-bold text-primary">{totalKcal} <span className="text-sm font-normal text-gray-400">kcal</span></span>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">➕ 食事を追加</h2>

        {!settings.anthropicApiKey && (
          <p className="text-xs text-orange-500 bg-orange-50 rounded-xl p-2">
            ⚠️ 設定でAnthropicのAPIキーを入力するとAI計算が使えます
          </p>
        )}

        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {[['text', '✏️ テキスト入力'], ['photo', '📷 写真で解析']].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => { setInputMode(mode); setAnalysisResult(null); setError('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                inputMode === mode ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Text mode */}
        {inputMode === 'text' && (
          <div className="space-y-2">
            <label className="text-xs text-gray-500 block">食事内容を入力してAIがカロリーを計算</label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setAnalysisResult(null) }}
              className="input-field resize-none"
              rows={3}
              placeholder={'例:\nご飯1杯、味噌汁、焼き鮭\nマクドナルド ビッグマックセット\nプロテイン1杯、バナナ1本'}
            />
            <button
              className="btn-accent w-full flex items-center justify-center gap-2"
              onClick={handleAnalyzeText}
              disabled={analyzing || !description.trim()}
            >
              {analyzing ? <><span className="animate-spin">⏳</span> AI計算中...</> : '🤖 AIでカロリーを計算'}
            </button>
          </div>
        )}

        {/* Photo mode */}
        {inputMode === 'photo' && (
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
            <button className="btn-outline w-full text-sm" onClick={() => fileRef.current?.click()}>
              📷 写真を選択・撮影
            </button>
            {photoPreview && (
              <>
                <img src={photoPreview} alt="食事" className="w-full rounded-xl max-h-48 object-cover" />
                <button
                  className="btn-accent w-full flex items-center justify-center gap-2"
                  onClick={handleAnalyzePhoto}
                  disabled={analyzing}
                >
                  {analyzing ? <><span className="animate-spin">⏳</span> AI解析中...</> : '🤖 AIで写真を解析'}
                </button>
              </>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{error}</p>}

        {/* AI result */}
        {analysisResult && (
          <div className="bg-teal-50 rounded-xl p-3 text-sm space-y-1">
            <p className="font-semibold text-teal-700">✅ AI解析結果</p>
            {analysisResult.items.map((item, i) => (
              <div key={i} className="flex justify-between text-gray-700">
                <span>{item.name} <span className="text-gray-400 text-xs">{item.amount}</span></span>
                <span>{item.calories} kcal</span>
              </div>
            ))}
            <div className="border-t border-teal-200 pt-1 flex justify-between font-bold text-teal-700">
              <span>合計</span>
              <span>{analysisResult.total} kcal</span>
            </div>
            {analysisResult.notes && <p className="text-xs text-gray-500 mt-1">※ {analysisResult.notes}</p>}
          </div>
        )}

        {/* Manual fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">食事タイプ</label>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="input-field">
              {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">カロリー (kcal) *</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="input-field"
              placeholder="0"
            />
          </div>
        </div>

        {inputMode === 'photo' && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">メモ（任意）</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="例: 昼食" />
          </div>
        )}

        <button className="btn-primary w-full" onClick={handleAdd} disabled={!calories}>
          記録する
        </button>
      </div>

      {/* Meal list */}
      {todayMeals.length > 0 && (
        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-700">📋 本日の食事</h2>
          {todayMeals.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs bg-orange-100 text-orange-600 rounded px-1 mr-2">{m.mealType}</span>
                <span className="text-sm text-gray-700">{m.description || '食事'}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-primary">{m.calories}</span>
                <span className="text-xs text-gray-400">kcal</span>
                <button className="text-gray-300 hover:text-red-400 text-lg leading-none" onClick={() => deleteMeal(m.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
