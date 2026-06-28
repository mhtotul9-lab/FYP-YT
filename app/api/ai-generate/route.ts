import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `তুমি একজন বাংলাদেশি YouTube থাম্বনেইল ডিজাইন বিশেষজ্ঞ। তোমার কাজ হলো ব্যবহারকারীর দেওয়া বিষয়বস্তুর উপর ভিত্তি করে একটি আকর্ষণীয় থাম্বনেইল কনফিগারেশন তৈরি করা।

তুমি শুধুমাত্র JSON ফরম্যাটে উত্তর দেবে। কোনো markdown backtick, ব্যাখ্যা বা অতিরিক্ত লেখা দেবে না। শুধু raw JSON।

JSON structure:
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
      "text": "মূল শিরোনাম বাংলায় ৩-৬ শব্দ",
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
      "text": "সাবটাইটেল বাংলায় ২-৪ শব্দ",
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

ডিজাইন নিয়ম (বিষয় অনুযায়ী রং বাছো):
- টেক/AI: gradientFrom "#0a0a2e" gradientTo "#1a0a3e", glow true, glowColor "#7C3AED", frameColor "#7C3AED"
- ভ্রমণ: gradientFrom "#064e3b" gradientTo "#065f46", frameColor "#10B981"
- ইনকাম/বিজনেস: gradientFrom "#1a1a1a" gradientTo "#2d1f00", color "#FFD700", gradient true in textLayers
- খাবার/রান্না: gradientFrom "#7f1d1d" gradientTo "#dc2626", frameColor "#FCA5A5"
- হরর/রহস্য: gradientFrom "#000000" gradientTo "#1a0000", glow true, frameColor "#DC2626"
- রিভিউ/প্রোডাক্ট: gradientFrom "#1e1b4b" gradientTo "#312e81", frameColor "#818CF8"
- সর্বদা বাংলায় টেক্সট, প্রাসঙ্গিক emoji যোগ করো
- শুধু JSON, অন্য কিছু নয়`

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

    const fullPrompt = `${SYSTEM_PROMPT}\n\nএই বিষয়ের জন্য থাম্বনেইল ডিজাইন করো: "${prompt}"\n\nশুধু JSON দাও:`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API error:', response.status, errText)
      return NextResponse.json(
        { error: 'GEMINI_ERROR', status: response.status, detail: errText },
        { status: 502 }
      )
    }

    const data = await response.json()

    // Extract text from Gemini response
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log('Gemini response length:', rawText.length)

    if (!rawText) {
      return NextResponse.json(
        { error: 'EMPTY_RESPONSE' },
        { status: 502 }
      )
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
    return NextResponse.json({ config: aiConfig })
  } catch (err) {
    console.error('Route error:', err)
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', detail: errMsg },
      { status: 500 }
    )
  }
}
