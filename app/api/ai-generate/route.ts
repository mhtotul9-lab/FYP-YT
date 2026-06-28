import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `তুমি একজন বাংলাদেশি YouTube থাম্বনেইল ডিজাইন বিশেষজ্ঞ। ব্যবহারকারীর দেওয়া বিষয়ের উপর ভিত্তি করে থাম্বনেইল কনফিগারেশন তৈরি করো।

শুধুমাত্র raw JSON দাও — কোনো markdown, backtick, বা ব্যাখ্যা নয়।

JSON format:
{
  "backgroundType": "gradient",
  "gradientFrom": "#hex",
  "gradientTo": "#hex",
  "gradientDirection": "135deg",
  "hasFrame": true,
  "frameColor": "#hex",
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
      "text": "বাংলায় মূল শিরোনাম ৩-৬ শব্দ + emoji",
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
      "text": "বাংলায় সাবটাইটেল ২-৪ শব্দ",
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

বিষয় অনুযায়ী রং:
- টেক/AI: gradientFrom "#0a0a2e" gradientTo "#1a0a3e" frameColor "#7C3AED" glow true glowColor "#7C3AED"
- ভ্রমণ: gradientFrom "#064e3b" gradientTo "#065f46" frameColor "#10B981"
- ইনকাম/বিজনেস: gradientFrom "#1a1a1a" gradientTo "#2d1f00" color "#FFD700" gradient true in main layer
- খাবার/রান্না: gradientFrom "#7f1d1d" gradientTo "#dc2626" frameColor "#FCA5A5"
- হরর/রহস্য: gradientFrom "#000000" gradientTo "#1a0000" glow true frameColor "#DC2626"
- রিভিউ/প্রোডাক্ট: gradientFrom "#1e1b4b" gradientTo "#312e81" frameColor "#818CF8"
- সব সময় বাংলায় লিখো, emoji যোগ করো, শুধু JSON`

// Free models on OpenRouter (no credit needed)
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-r1-0528:free',
  'microsoft/phi-4-reasoning:free',
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

    let lastError = ''

    for (const model of FREE_MODELS) {
      try {
        console.log(`Trying model: ${model}`)

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
              { role: 'user', content: `এই বিষয়ের জন্য থাম্বনেইল ডিজাইন করো: "${prompt}"` },
            ],
            max_tokens: 1200,
            temperature: 0.7,
          }),
        })

        if (response.status === 429 || response.status === 503) {
          lastError = `${model}: ${response.status} rate limited`
          console.log(`${model} rate limited, trying next...`)
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          lastError = `${model}: ${response.status} ${errText.slice(0, 200)}`
          console.error(`${model} error:`, response.status, errText.slice(0, 200))
          continue
        }

        const data = await response.json()
        const rawText: string = data?.choices?.[0]?.message?.content || ''

        if (!rawText) {
          lastError = `${model}: empty response`
          console.log(`${model} empty response`)
          continue
        }

        // Strip markdown fences if present
        let jsonStr = rawText.trim()
        const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenceMatch) jsonStr = fenceMatch[1].trim()
        const braceStart = jsonStr.indexOf('{')
        const braceEnd = jsonStr.lastIndexOf('}')
        if (braceStart !== -1 && braceEnd !== -1) {
          jsonStr = jsonStr.slice(braceStart, braceEnd + 1)
        }

        const aiConfig = JSON.parse(jsonStr)
        console.log(`✅ Success with: ${model}`)
        return NextResponse.json({ config: aiConfig, model })

      } catch (modelErr) {
        lastError = `${model}: ${String(modelErr)}`
        console.error(`${model} exception:`, modelErr)
        continue
      }
    }

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
