import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { analyzeBodyComposition } from '../utils/claude'
import { todayStr } from '../utils/calories'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const FIELDS = [
  { key: 'weight', label: '体重', unit: 'kg', required: true },
  { key: 'bodyFatPercent', label: '体脂肪率', unit: '%' },
  { key: 'muscleMass', label: '筋肉量', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'visceralFatLevel', label: '内臓脂肪レベル', unit: '' },
  { key: 'bmr', label: '基礎代謝量', unit: 'kcal' },
  { key: 'bodyAge', label: '体内年齢', unit: '才' },
  { key: 'boneMass', label: '推定骨量', unit: 'kg' },
]

const empty = () => ({
  date: todayStr(),
  weight: '', bodyFatPercent: '', muscleMass: '', bmi: '',
  visceralFatLevel: '', bmr: '', bodyAge: '', boneMass: '',
  bodyFatBadge: '', bmiBadge: '',
})

export default function BodyMetrics() {
  const { bodyMetrics, addBodyMetric, settings } = useApp()
  const [form, setForm] = useState(empty)
  const [saved, setSaved] = useState(false)
  const [chartKey, setChartKey] = useState('weight')
  const [scanning, setScanning] = useState(false)
  const [scanPreview, setScanPreview] = useState(null)
  const [scanError, setScanError] = useState('')
  const [scanSuccess, setScanSuccess] = useState(false)
  const fileRef = useRef()

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleScreenshotSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanError('')
    setScanSuccess(false)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setScanPreview(dataUrl)
      if (!settings.anthropicApiKey) {
        setScanError('⚠️ 設定でAnthropicのAPIキーを入力してください')
        return
      }
      setScanning(true)
      try {
        const base64 = dataUrl.split(',')[1]
        const result = await analyzeBodyComposition(settings.anthropicApiKey, base64, file.type)
        // Merge non-null results into form
        setForm((prev) => {
          const next = { ...prev }
          if (result.date) next.date = result.date
          FIELDS.forEach(({ key }) => {
            if (result[key] != null) next[key] = String(result[key])
          })
          if (result.bodyFatBadge) next.bodyFatBadge = result.bodyFatBadge
          if (result.bmiBadge) next.bmiBadge = result.bmiBadge
          return next
        })
        setScanSuccess(true)
      } catch (err) {
        setScanError(`解析エラー: ${err.message}`)
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.weight) return
    const entry = { date: form.date, bodyFatBadge: form.bodyFatBadge, bmiBadge: form.bmiBadge }
    FIELDS.forEach(({ key }) => {
      entry[key] = form[key] !== '' ? Number(form[key]) : undefined
    })
    addBodyMetric(entry)
    setSaved(true)
    setScanPreview(null)
    setScanSuccess(false)
    if (fileRef.current) fileRef.current.value = ''
    setTimeout(() => setSaved(false), 2000)
  }

  const chartData = bodyMetrics.slice(-30).map((m) => ({
    date: m.date.slice(5),
    weight: m.weight,
    bodyFat: m.bodyFatPercent,
    muscle: m.muscleMass,
  }))

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-xl font-bold">⚖️ 体組成データ</h1>

      {/* Screenshot scan */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">📱 スクリーンショットから自動入力</h2>
        <p className="text-xs text-gray-500">体組成計アプリのスクリーンショットを選択するとAIが自動で数値を読み取ります</p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotSelect}
          className="hidden"
        />
        <button
          className="btn-accent w-full flex items-center justify-center gap-2"
          onClick={() => { setScanPreview(null); setScanError(''); setScanSuccess(false); fileRef.current?.click() }}
          disabled={scanning}
        >
          {scanning
            ? <><span className="animate-spin inline-block">⏳</span> AI解析中...</>
            : '📷 スクリーンショットを選択'
          }
        </button>

        {scanPreview && (
          <img src={scanPreview} alt="スクリーンショット" className="w-full rounded-xl max-h-56 object-contain bg-gray-100" />
        )}

        {scanError && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{scanError}</p>
        )}

        {scanSuccess && (
          <p className="text-teal-600 text-sm bg-teal-50 rounded-xl p-3 font-medium">
            ✅ 読み取り完了！下のフォームに自動入力されました。確認して保存してください。
          </p>
        )}
      </div>

      {/* Input form */}
      <form className="card space-y-3" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">📝 測定データ</h2>
          <button
            type="button"
            className="text-xs text-gray-400 underline"
            onClick={() => { setForm(empty()); setScanPreview(null); setScanSuccess(false) }}
          >
            リセット
          </button>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">測定日</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, unit, required }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">
                {label}{unit ? ` (${unit})` : ''}{required && <span className="text-red-400"> *</span>}
              </label>
              <input
                type="number"
                step="0.01"
                value={form[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className={`input-field ${scanSuccess && form[key] ? 'ring-2 ring-accent border-transparent' : ''}`}
                placeholder="--"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">体脂肪判定</label>
            <select
              value={form.bodyFatBadge}
              onChange={(e) => handleChange('bodyFatBadge', e.target.value)}
              className="input-field"
            >
              {['', '低い', '標準', '軽肥満', '肥満'].map((v) => (
                <option key={v} value={v}>{v || '選択'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">BMI判定</label>
            <select
              value={form.bmiBadge}
              onChange={(e) => handleChange('bmiBadge', e.target.value)}
              className="input-field"
            >
              {['', '低体重', '普通体重', '過体重', '肥満'].map((v) => (
                <option key={v} value={v}>{v || '選択'}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-accent w-full" disabled={!form.weight}>
          {saved ? '✅ 保存しました！' : '保存する'}
        </button>
      </form>

      {/* Charts */}
      {chartData.length >= 2 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">📈 推移グラフ</h2>
            <select
              value={chartKey}
              onChange={(e) => setChartKey(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value="weight">体重</option>
              <option value="bodyFat">体脂肪率</option>
              <option value="muscle">筋肉量</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={chartKey}
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={chartKey === 'weight' ? '体重(kg)' : chartKey === 'bodyFat' ? '体脂肪率(%)' : '筋肉量(kg)'}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History list */}
      {bodyMetrics.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-3">📋 記録一覧</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...bodyMetrics].reverse().map((m) => (
              <div key={m.date} className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-700">{m.date}</span>
                  <span className="text-lg font-bold text-primary">{m.weight} kg</span>
                </div>
                <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                  {m.bodyFatPercent != null && <span>体脂肪 {m.bodyFatPercent}%</span>}
                  {m.muscleMass != null && <span>筋肉 {m.muscleMass}kg</span>}
                  {m.bmi != null && <span>BMI {m.bmi}</span>}
                  {m.bmr != null && <span>基礎代謝 {m.bmr}kcal</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
