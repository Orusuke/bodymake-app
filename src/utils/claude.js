const API_URL = 'https://api.anthropic.com/v1/messages'
const HEADERS = (apiKey) => ({
  'x-api-key': apiKey,
  'anthropic-version': '2023-06-01',
  'content-type': 'application/json',
  'anthropic-dangerous-direct-browser-access': 'true',
})

async function callClaude(apiKey, messages) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: HEADERS(apiKey),
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, messages }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }
  const data = await response.json()
  const text = data.content[0].text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('レスポンスのパースに失敗しました')
  return JSON.parse(jsonMatch[0])
}

// Analyze food photo using Claude Vision
export async function analyzeFoodPhoto(apiKey, base64Image, mimeType = 'image/jpeg') {
  return callClaude(apiKey, [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: base64Image },
      },
      {
        type: 'text',
        text: `この食事の写真を分析して、JSONのみを返してください（他のテキスト不要）:
{
  "items": [{"name": "料理名", "calories": カロリー数値, "amount": "量の説明"}],
  "total": 合計カロリー数値,
  "notes": "推定根拠（任意）"
}
・カロリーはkcal整数・不明な食品はbest guessで推定・日本語で返答`,
      },
    ],
  }])
}

// Analyze food description text using Claude
export async function analyzeFoodText(apiKey, description) {
  return callClaude(apiKey, [{
    role: 'user',
    content: `以下の食事内容のカロリーを推定して、JSONのみを返してください（他のテキスト不要）:

食事内容: ${description}

{
  "items": [{"name": "料理名", "calories": カロリー数値, "amount": "量の説明"}],
  "total": 合計カロリー数値,
  "notes": "推定根拠（任意）"
}
・カロリーはkcal整数・量が不明な場合は一般的な一人前で推定・日本語で返答`,
  }])
}

// Analyze body composition screenshot using Claude Vision
export async function analyzeBodyComposition(apiKey, base64Image, mimeType = 'image/jpeg') {
  return callClaude(apiKey, [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: mimeType, data: base64Image },
      },
      {
        type: 'text',
        text: `この体組成計アプリのスクリーンショットから数値を読み取り、JSONのみを返してください（他のテキスト不要）:

{
  "date": "YYYY-MM-DD形式（画像に日付があれば。なければnull）",
  "weight": 体重の数値またはnull,
  "bodyFatPercent": 体脂肪率の数値またはnull,
  "muscleMass": 筋肉量の数値またはnull,
  "bmi": BMIの数値またはnull,
  "visceralFatLevel": 内臓脂肪レベルの数値またはnull,
  "bmr": 基礎代謝量の数値（kcal）またはnull,
  "bodyAge": 体内年齢の数値またはnull,
  "boneMass": 推定骨量の数値またはnull,
  "bodyFatBadge": 体脂肪率の判定ラベル（「低い」「標準」「軽肥満」「肥満」のいずれかまたはnull）,
  "bmiBadge": BMIの判定ラベル（「低体重」「普通体重」「過体重」「肥満」のいずれかまたはnull）
}

・数値は単位なしの数値のみ
・読み取れない項目はnull`,
      },
    ],
  }])
}

// Analyze exercise description using Claude
export async function analyzeExercise(apiKey, description, weightKg) {
  return callClaude(apiKey, [{
    role: 'user',
    content: `以下の運動内容の消費カロリーを推定して、JSONのみを返してください（他のテキスト不要）:

運動内容: ${description}
体重: ${weightKg} kg

{
  "items": [{"name": "運動名", "calories": 消費カロリー数値, "duration": "時間・セット数等の説明", "met": MET値}],
  "total": 合計消費カロリー数値,
  "notes": "推定根拠（任意）"
}
・カロリーはkcal整数・MET × 体重(kg) × 時間(h) を基本計算式として使用・時間・回数が不明な場合は一般的な値で推定・日本語で返答`,
  }])
}
