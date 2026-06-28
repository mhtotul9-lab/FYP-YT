import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a Bangladeshi YouTube thumbnail design expert. Create a thumbnail config JSON for the given topic.

Return ONLY raw JSON. No markdown, no backticks, no explanation whatsoever.

JSON structure (fill in appropriate values):
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
      "text": "WRITE IN BENGALI - catchy headline 3-6 words with emoji",
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
      "text": "WRITE IN BENGALI - subtitle 2-4 words",
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

Design rules by topic category:
- Tech/AI/YouTube: gradientFrom "#0a0a2e" gradientTo "#1a0a3e" frameColor "#7C3AED" frameWidth 5
- Travel/Adventure: gradientFrom "#064e3b" gradientTo "#065f46" frameColor "#10B981"  
- Income/Business/Money: gradientFrom "#1a1a1a" gradientTo "#2d1f00" main text color "#FFD700" gradient true gradientFrom "#FFD700" gradientTo "#FF6B35"
- Food/Cooking: gradientFrom "#7f1d1d" gradientTo "#dc2626" frameColor "#FCA5A5"
- Horror/Mystery: gradientFrom "#000000" gradientTo "#1a0000" glow true glowColor "#DC2626" frameColor "#DC2626"
- Review/Product: gradientFrom "#1e1b4b" gradientTo "#312e81" frameColor "#818CF8"

IMPORTANT: All text must be in Bengali (Bangla script). Add relevant emoji. Return ONLY the JSON object.`

// Currently verified working free models on OpenRouter (June 2025)
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'qwen/qwen3-8b:free',
  'qwen/qwen3-14b:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'tngtech/deepseek-r1t-chimera:free',
  'moonshotai/kimi-vl-a3b-thinking:free',
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

    console.log(`[ai-generate] prompt: "${prompt}"`)

    let lastError = ''
    let attemptedModels = 0

    for (const model of FREE_MODELS) {
      attemptedModels++
      try {
        console.log(`[ai-generate] trying (${attemptedModels}/${FREE_MODELS.length}): ${model}`)

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
              {
                role: 'user',
                content: `Topic: "${prompt}". Create thumbnail config. All text in Bengali. Return only JSON.`,
              },
            ],
            max_tokens: 1500,
            temperature: 0.7,
          }),
        })

        const resText = await res.text()
        console.log(`[ai-generate] ${model} → status: ${res.status}`)

        // Skip and try next on these error codes
        if (res.status === 429 || res.status === 503 || res.status === 502) {
          lastError = `${model}: rate limited (${res.status})`
          console.log(`[ai-generate] rate limited, trying next...`)
          continue
        }

        if (res.status === 404) {
          lastError = `${model}: not available (404)`
          console.log(`[ai-generate] model not available, trying next...`)
          continue
        }

        if (!res.ok) {
          lastError = `${model}: error ${res.status}`
          console.error(`[ai-generate] ${model} error: ${resText.slice(0, 300)}`)
          continue
        }

        const data = JSON.parse(resText)
        let rawText: string = data?.choices?.[0]?.message?.content || ''

        if (!rawText || rawText.trim().length < 10) {
          lastError = `${model}: empty response`
          console.log(`[ai-generate] empty response from ${model}`)
          continue
        }

        console.log(`[ai-generate] got response from ${model}, length: ${rawText.length}`)

        // Strip <think> tags (some models include reasoning)
        rawText = rawText.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

        // Strip markdown fences
        let jsonStr = rawText.trim()
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenceMatch) jsonStr = fenceMatch[1].trim()

        // Extract JSON object
        const b1 = jsonStr.indexOf('{')
        const b2 = jsonStr.lastIndexOf('}')
        if (b1 === -1 || b2 === -1) {
          lastError = `${model}: no JSON found in response`
          console.log(`[ai-generate] no JSON in response: ${jsonStr.slice(0, 200)}`)
          continue
        }
        jsonStr = jsonStr.slice(b1, b2 + 1)

        const aiConfig = JSON.parse(jsonStr)

        // Validate required fields exist
        if (!aiConfig.textLayers || !Array.isArray(aiConfig.textLayers)) {
          lastError = `${model}: invalid config structure`
          continue
        }

        console.log(`[ai-generate] ✅ SUCCESS with: ${model}`)
        return NextResponse.json({ config: aiConfig, model })

      } catch (e) {
        lastError = `${model}: exception - ${String(e).slice(0, 100)}`
        console.error(`[ai-generate] ${model} exception:`, String(e).slice(0, 200))
        continue
      }
    }

    console.error(`[ai-generate] ❌ All ${FREE_MODELS.length} models failed. Last: ${lastError}`)
    return NextResponse.json(
      { error: 'ALL_MODELS_FAILED', detail: lastError },
      { status: 502 }
    )

  } catch (err) {
    console.error('[ai-generate] route error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: String(err) },
      { status: 500 }
    )
  }
}
