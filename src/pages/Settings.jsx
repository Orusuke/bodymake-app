import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { WORK_TYPE_LABELS, calcTDEE, calcWorkCalories } from '../utils/calories'

export default function Settings() {
  const { settings, saveSettings } = useApp()
  const [form, setForm] = useState(settings)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = () => {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tdeePreview = form.targetWeight
    ? null
    : null

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-xl font-bold">⚙️ 設定</h1>

      {/* Personal info */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">👤 基本情報</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">身長 (cm)</label>
            <input
              type="number"
              value={form.height}
              onChange={(e) => set('height', e.target.value)}
              className="input-field"
              placeholder="170"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">年齢</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
              className="input-field"
              placeholder="30"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">性別</label>
            <select
              value={form.sex}
              onChange={(e) => set('sex', e.target.value)}
              className="input-field"
            >
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目標体重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={form.targetWeight}
              onChange={(e) => set('targetWeight', e.target.value)}
              className="input-field"
              placeholder="62"
            />
          </div>
        </div>
      </div>

      {/* Work settings */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">💼 仕事・生活活動</h2>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">仕事の種類（活動量）</label>
          <select
            value={form.workType}
            onChange={(e) => set('workType', e.target.value)}
            className="input-field"
          >
            {Object.entries(WORK_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">1日の労働時間 (h)</label>
            <input
              type="number"
              value={form.workHoursPerDay}
              onChange={(e) => set('workHoursPerDay', Number(e.target.value))}
              className="input-field"
              placeholder="8"
              min="0"
              max="16"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">週の労働日数 (日)</label>
            <input
              type="number"
              value={form.workDaysPerWeek}
              onChange={(e) => set('workDaysPerWeek', Number(e.target.value))}
              className="input-field"
              placeholder="5"
              min="0"
              max="7"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-700">💡 活動量について</p>
          <p>設定した仕事の種類と時間は、ダッシュボードの消費カロリー計算（TDEE）に反映されます。</p>
          <p>・座り仕事: BMR × 1.2倍</p>
          <p>・軽活動: BMR × 1.375倍</p>
          <p>・中程度活動: BMR × 1.55倍</p>
        </div>
      </div>

      {/* API Key */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">🤖 Anthropic APIキー</h2>
        <p className="text-xs text-gray-500">
          食事写真のAI解析機能を使うには、Anthropic（Claude）のAPIキーが必要です。
          <a
            href="https://console.anthropic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline ml-1"
          >
            取得はこちら
          </a>
        </p>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={form.anthropicApiKey}
            onChange={(e) => set('anthropicApiKey', e.target.value)}
            className="input-field pr-16"
            placeholder="sk-ant-..."
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
            onClick={() => setShowKey((v) => !v)}
            type="button"
          >
            {showKey ? '隠す' : '表示'}
          </button>
        </div>
        <p className="text-xs text-orange-500 bg-orange-50 rounded-xl p-2">
          ⚠️ APIキーはブラウザのlocalStorageに保存されます。共有デバイスでの使用には注意してください。
        </p>
      </div>

      <button className="btn-accent w-full" onClick={handleSave}>
        {saved ? '✅ 保存しました！' : '設定を保存'}
      </button>

      {/* Data management */}
      <div className="card space-y-2">
        <h2 className="font-semibold text-gray-700">📦 データ管理</h2>
        <p className="text-xs text-gray-500">すべてのデータはブラウザのlocalStorageに保存されます。</p>
        <button
          className="btn-outline w-full text-sm text-red-500 border-red-200"
          onClick={() => {
            if (confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
              localStorage.clear()
              window.location.reload()
            }
          }}
        >
          🗑️ データをすべて削除
        </button>
      </div>
    </div>
  )
}
