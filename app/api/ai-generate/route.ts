import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `তুমি একজন বাংলাদেশি YouTube থাম্বনেইল ডিজাইন বিশেষজ্ঞ। তোমার কাজ হলো ব্যবহারকারীর দেওয়া বিষয়বস্তুর উপর ভিত্তি করে একটি আকর্ষণীয় থাম্বনেইল কনফিগারেশন তৈরি করা।

তুমি শুধুমাত্র JSON ফরম্যাটে উত্তর দেবে, অন্য কিছু লিখবে না, কোনো markdown backtick বা ব্যাখ্যা দেবে না।

JSON structure এভাবে হবে:
{
  "backgroundType": "gradient",
  "gradientFrom": "#hex",
  "gradientTo": "#hex",
  "gradientDirection": "135deg",
  "hasFrame": true,
  "frameColor": "#hex",
  "frameWidth": 5,
  "hasLogo": true,
  "logoText": "চ্যানেল নাম",
  "logoX": 40,
  "logoY": 40,
  "logoSize": 38,
  "hasTag": false,
  "tagText": "",
  "tagColor": "#FF0000",
  "textLayers": [
    {
      "id": "main",
      "text": "মূল শিরোনাম বাংলায়",
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
      "gradientFrom": "#FFD700",
      "gradientTo": "#FF6B35",
      "align": "left",
      "fontFamily": "Noto Sans Bengali",
      "uppercase": false,
      "outline": false,
      "glow": false,
      "glowColor": "#FFD700"
    },
    {
      "id": "sub",
      "text": "সাবটাইটেল বাংলায়",
      "x": 60,
      "y": 300,
      "fontSize": 60,
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

ডিজাইন নিয়ম:
- টেক/AI বিষয়ে: gradientFrom "#0a0a2e" gradientTo "#1a0a3e", glow true, glowColor "#7C3AED", gradient text true
- ভ্রমণে: gradientFrom "#064e3b" gradientTo "#065f46", frameColor "#10B981"
- ইনকাম/বিজনেসে: gradientFrom "#1a1a1a" gradientTo "#2d1f00", yellow text "#FFD700", gradient true
- খাবারে: gradientFrom "#7f1d1d" gradientTo "#dc2626"
- হরর/রহস্যে: gradientFrom "#000000" gradientTo "#1a0000", glow true, frameColor "#DC2626"
- রিভিউতে: gradientFrom "#1e1b4b" gradientTo "#312e81"
- সর্বদা বাংলায় টেক্সট লিখো, সংক্ষিপ্ত কিন্তু আকর্ষণীয়
- প্রাসঙ্গিক emoji ব্যবহার করো
- শুধু JSON দাও, অন্য কিছু নয়`

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'NO_API_KEY' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `এই বিষয়ের জন্য থাম্বনেইল ডিজাইন করো: "${prompt}"` },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)
      return NextResponse.json({ error: 'ANTHROPIC_ERROR', detail: errText }, { status: 502 })
    }

    const data = await response.json()
    const rawText: string = data.content?.[0]?.text || ''

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
    return NextResponse.json({ config: aiConfig })
  } catch (err) {
    console.error('Route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
