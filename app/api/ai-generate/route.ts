import { NextRequest, NextResponse } from 'next/server'

const PROMPT_TEMPLATE = (topic: string) => `তুমি একজন বাংলাদেশি YouTube থাম্বনেইল ডিজাইন বিশেষজ্ঞ।
এই বিষয়ের জন্য থাম্বনেইল ডিজাইন করো: "${topic}"

শুধুমাত্র নিচের JSON format এ উত্তর দাও, অন্য কিছু লিখবে না:

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
      "text": "বাংলায় মূল শিরোনাম",
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
      "text": "বাংলায় সাবটাইটেল",
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

নিয়ম:
- টেক/AI: gradientFrom "#0a0a2e" gradientTo "#1a0a3e" frameColor "#7C3AED" glow true
- ভ্রমণ: gradientFrom "#064e3b" gradientTo "#065f46" frameColor "#10B981"
- ইনকাম/বিজনেস: gradientFrom "#1a1a1a" gradientTo "#2d1f00" color "#FFD700" gradient true
- খাবার: gradientFrom "#7f1d1d" gradientTo "#dc2626" frameColor "#FCA5A5"
- হরর: gradientFrom "#000000" gradientTo "#1a0000" glow true frameColor "#DC2626"
- রিভিউ: gradientFrom "#1e1b4b" gradientTo "#312e81" frameColor "#818CF8"
- text এ বাংলায় লিখো, emoji যোগ করো
- শুধু JSON দাও`

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'NO_API_KEY' }, { status: 500 })
    }

    // Try gemini-1.5-flash first (most available on free tier), fallback to others
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-lite',
    ]

    let lastError = ''
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT_TEMPLATE(prompt) }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
            },
          }),
        })

        if (response.status === 429) {
          // Rate limited on this model, try next
          lastError = `Model ${model}: rate limited (429)`
          console.log(`${model} rate limited, trying next...`)
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          lastError = `Model ${model}: ${response.status} ${errText}`
          console.error(`${model} error:`, response.status, errText)
          continue
        }

        const data = await response.json()
        let rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''

        if (!rawText) {
          lastError = `Model ${model}: empty response`
          continue
        }

        // Strip markdown fences
        let jsonStr = rawText.trim()
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenceMatch) jsonStr = fenceMatch[1].trim()
        const braceStart = jsonStr.indexOf('{')
        const braceEnd = jsonStr.lastIndexOf('}')
        if (braceStart !== -1 && braceEnd !== -1) {
          jsonStr = jsonStr.slice(braceStart, braceEnd + 1)
        }

        const aiConfig = JSON.parse(jsonStr)
        console.log(`Success with model: ${model}`)
        return NextResponse.json({ config: aiConfig, model })

      } catch (modelErr) {
        lastError = `Model ${model}: ${String(modelErr)}`
        console.error(`${model} exception:`, modelErr)
        continue
      }
    }

    // All models failed
    console.error('All models failed. Last error:', lastError)
    return NextResponse.json(
      { error: 'ALL_MODELS_FAILED', detail: lastError },
      { status: 502 }
    )

  } catch (err) {
    console.error('Route error:', err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: String(err) },
      { status: 500 }
    )
  }
}
