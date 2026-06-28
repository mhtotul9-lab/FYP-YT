import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a Bangladeshi YouTube thumbnail design expert. Create thumbnail configurations based on the user's topic.

Return ONLY raw JSON, no markdown, no backticks, no explanation.

JSON format:
{
  "backgroundType": "gradient",
  "gradientFrom": "#0a0a2e",
  "gradientTo": "#1a0a3e",
  "gradientDirection": "135deg",
  "hasFrame": true,
  "frameColor": "#7C3AED",
  "frameWidth": 5,
  "hasLogo": true,
  "logoText": "চলতি",
  "logoX": 40,
  "logoY": 40,
  "logoSize": 38,
  "hasTag": false,
  "tagText": "",
  "tagColor": "#FF0000",
  "textLayers": [
    {
      "id": "main",
      "text": "Bengali headline 3-6 words + emoji",
      "x": 60,
      "y": 160,
      "fontSize": 95,
      "fontWeight": "900",
      "color": "#FFFFFF",
      "strokeColor": "#000000",
      "strokeWidth": 4,
      "shadowColor": "#000000",
      "shadowBlur": 20,
      "rotation": 0,
      "gradient": false,
      "gradientFrom": "#A855F7",
      "gradientTo": "#06B6D4",
      "align": "left",
      "fontFamily": "Noto Sans Bengali",
      "uppercase": false,
      "outline": false,
      "glow": false,
      "glowColor": "#7C3AED"
    },
    {
      "id": "sub",
      "text": "Bengali subtitle 2-4 words",
      "x": 60,
      "y": 300,
      "fontSize": 58,
      "fontWeight": "700",
      "color": "#FFD700",
      "strokeColor": "#000000",
      "strokeWidth": 2,
      "shadowColor": "#000000",
      "shadowBlur": 10,
      "rotation": 0,
      "gradient": false,
      "gradientFrom": "#FFD700",
      "gradientTo": "#FF6B35",
      "align": "left",
      "fontFamily": "Noto Sans Bengali",
      "uppercase": false,
      "outline": false,
      "glow": false,
      "glowColor": "#FFD700"
    }
  ]
}

Color rules by topic:
- Tech/AI: gradientFrom "#0a0a2e" gradientTo "#1a0a3e" frameColor "#7C3AED" glow true
- Travel: gradientFrom "#064e3b" gradientTo "#065f46" frameColor "#10B981"
- Income/Business: gradientFrom "#1a1a1a" gradientTo "#2d1f00" main color "#FFD700" gradient true
- Food: gradientFrom "#7f1d1d" gradientTo "#dc2626" frameColor "#FCA5A5"
- Horror: gradientFrom "#000000" gradientTo "#1a0000" glow true frameColor "#DC2626"
- Review: gradientFrom "#1e1b4b" gradientTo "#312e81" frameColor "#818CF8"
Always write text in Bengali, add relevant emoji. Return only JSON.`

const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-27b-it:free',
  'microsoft/phi-4-reasoning:free',
  'deepseek/deepseek-r1-0528:free',
]

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'NO_API_KEY' }, { status: 500 })
    }

    console.log(`[ai-generate] prompt: "${prompt}", key starts: ${apiKey.slice(0, 10)}...`)

    let lastError = ''

    for (const model of FREE_MODELS) {
      try {
        console.log(`[ai-generate] trying: ${model}`)

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://fyp-yt.vercel.app',
            'X-Title': 'Bangla Thumbnail Generator',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Create thumbnail for: "${prompt}". Write all text in Bengali.` },
            ],
            max_tokens: 1200,
            temperature: 0.7,
          }),
        })

        const resText = await res.text()
        console.log(`[ai-generate] ${model} status: ${res.status}, body: ${resText.slice(0, 300)}`)

        if (res.status === 429 || res.status === 503 || res.status === 502) {
          lastError = `${model}: ${res.status}`
          continue
        }

        if (!res.ok) {
          lastError = `${model}: ${res.status} - ${resText.slice(0, 200)}`
          continue
        }

        const data = JSON.parse(resText)
        let rawText: string = data?.choices?.[0]?.message?.content || ''

        if (!rawText) {
          lastError = `${model}: empty content`
          continue
        }

        // Strip markdown fences
        let jsonStr = rawText.trim()
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenceMatch) jsonStr = fenceMatch[1].trim()
        const b1 = jsonStr.indexOf('{')
        const b2 = jsonStr.lastIndexOf('}')
        if (b1 !== -1 && b2 !== -1) jsonStr = jsonStr.slice(b1, b2 + 1)

        const aiConfig = JSON.parse(jsonStr)
        console.log(`[ai-generate] ✅ success with: ${model}`)
        return NextResponse.json({ config: aiConfig, model })

      } catch (e) {
        lastError = `${model}: ${String(e)}`
        console.error(`[ai-generate] ${model} exception:`, e)
        continue
      }
    }

    console.error(`[ai-generate] all models failed. last: ${lastError}`)
    return NextResponse.json({ error: 'ALL_MODELS_FAILED', detail: lastError }, { status: 502 })

  } catch (err) {
    console.error('[ai-generate] route error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: String(err) }, { status: 500 })
  }
}
