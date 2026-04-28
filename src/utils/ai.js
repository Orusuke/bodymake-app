const OR_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL_VISION = 'meta-llama/llama-4-maverick:free'
const MODEL_TEXT = 'google/gemma-3-27b-it:free'

async function callOpenRouter(apiKey, messages, useVision = false) {
  const response = await fetch(OR_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://orusuke.github.io/bodymake-app/',
    },
    body: JSON.stringify({
      model: useVision ? MODEL_VISION : MODEL_TEXT,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('レスポンスが空です')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('レスポンスのパースに失敗しました')
  return JSON.parse(jsonMatch[0])
}

// 食事写真 → カロリー解析
export async function analyzeFoodPhoto(apiKey, base64Image, mimeType = 'image/jpeg') {
  return callOpenRouter(apiKey, [{
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      { type: 'text', text: `この食事の写真を分析して、JSONのみを返してください（説明文不要）:
{"items":[{"name":"料理名","calories":カロリー数値,"amount":"量の説明"}],"total":合計カロリー数値,"notes":"推定根拠（任意）"}
・カロリーはkcal整数・不明な食品はbest guessで推定・日本語で返答` },
    ],
  }], true)
}

// 食事テキスト → カロリー計算
export async function analyzeFoodText(apiKey, description) {
  return callOpenRouter(apiKey, [{
    role: 'user',
    content: `以下の食事内容のカロリーを推定して、JSONのみを返してください（説明文不要）:
食事内容: ${description}
{"items":[{"name":"料理名","calories":カロリー数値,"amount":"量の説明"}],"total":合計カロリー数値,"notes":"推定根拠（任意）"}
・カロリーはkcal整数・量不明な場合は一般的な一人前で推定・日本語で返答`,
  }])
}

// 運動テキスト → 消費カロリー計算
export async function analyzeExercise(apiKey, description, weightKg) {
  return callOpenRouter(apiKey, [{
    role: 'user',
    content: `以下の運動内容の消費カロリーを推定して、JSONのみを返してください（説明文不要）:
運動内容: ${description}
体重: ${weightKg} kg
{"items":[{"name":"運動名","calories":消費カロリー数値,"duration":"時間・セット数等","met":MET値}],"total":合計消費カロリー数値,"notes":"推定根拠（任意）"}
・カロリーはkcal整数・MET×体重(kg)×時間(h)を基本計算式として使用・日本語で返答`,
  }])
}

// 体組成スクリーンショット → 数値読み取り
export async function analyzeBodyComposition(apiKey, base64Image, mimeType = 'image/jpeg') {
  return callOpenRouter(apiKey, [{
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      { type: 'text', text: `この体組成計アプリのスクリーンショットから数値を読み取り、JSONのみを返してください（説明文不要）:
{"date":"YYYY-MM-DD形式またはnull","weight":体重またはnull,"bodyFatPercent":体脂肪率またはnull,"muscleMass":筋肉量またはnull,"bmi":BMIまたはnull,"visceralFatLevel":内臓脂肪レベルまたはnull,"bmr":基礎代謝kcalまたはnull,"bodyAge":体内年齢またはnull,"boneMass":骨量またはnull,"bodyFatBadge":"低い/標準/軽肥満/肥満またはnull","bmiBadge":"低体重/普通体重/過体重/肥満またはnull"}
・数値は単位なしの数値のみ・読み取れない項目はnull` },
    ],
  }], true)
}
