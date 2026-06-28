import { NextRequest, NextResponse } from 'next/server'

const PROMPT = (topic: string) => `You are a Bangladeshi YouTube thumbnail designer. Create a thumbnail config JSON for: "${topic}"

Rules:
- ALL text fields must be written in Bengali (Bangla script)
- Add relevant emoji to text
- Choose colors based on topic:
  Tech/AI/YouTube: gradientFrom "#0a0a2e" gradientTo "#1a0a3e" frameColor "#7C3AED"
  Travel: gradientFrom "#064e3b" gradientTo "#065f46" frameColor "#10B981"
  Money/Business: gradientFrom "#1a1a1a" gradientTo "#2d1f00" main color "#FFD700"
  Food: gradientFrom "#7f1d1d" gradientTo "#dc2626" frameColor "#FCA5A5"
  Horror: gradientFrom "#000000" gradientTo "#1a0000" frameColor "#DC2626" glow true
  Review: gradientFrom "#1e1b4b" gradientTo "#312e81" frameColor "#818CF8"

Return ONLY this JSON (no markdown, no explanation):
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
      "text": "বাংলায় শিরোনাম লিখুন + emoji",
      "x": 60, "y": 160, "fontSize": 95, "fontWeight": "900",
      "color": "#FFFFFF", "strokeColor": "#000000", "strokeWidth": 4,
      "shadowColor": "#000000", "shadowBlur": 20, "rotation": 0,
      "gradient": false, "gradientFrom": "#A855F7", "gradientTo": "#06B6D4",
      "align": "left", "fontFamily": "Noto Sans Bengali",
      "uppercase": false, "outline": false, "glow": false, "glowColor": "#7C3AED"
    },
    {
      "id": "sub",
      "text": "বাংলায় সাবটাইটেল",
      "x": 60, "y": 300, "fontSize": 58, "fontWeight": "700",
      "color": "#FFD700", "strokeColor": "#000000", "strokeWidth": 2,
      "shadowColor": "#000000", "shadowBlur": 10, "rotation": 0,
      "gradient": false, "gradientFrom": "#FFD700", "gradientTo": "#FF6B35",
      "align": "left", "fontFamily": "Noto Sans Bengali",
      "uppercase": false, "outline": false, "glow": false, "glowColor": "#FFD700"
    }
  ]
}`

function extractJson(raw: string): object | null {
  try {
    let s = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fence) s = fence[1].trim()
    const b1 = s.indexOf('{'), b2 = s.lastIndexOf('}')
    if (b1 === -1 || b2 === -1) return null
    const cfg = JSON.parse(s.slice(b1, b2 + 1))
    return cfg.textLayers ? cfg : null
  } catch { return null }
}

// ── Provider 1: Groq (FREE, fast, reliable) ──────────────────────────────────
async function tryGroq(prompt: string, apiKey: string): Promise<string | null> {
  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'mixtral-8x7b-32768',
  ]
  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: PROMPT(prompt) }],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })
      if (res.status === 429) { console.log(`Groq ${model}: rate limited`); continue }
      if (!res.ok) { console.log(`Groq ${model}: ${res.status}`); continue }
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content || ''
      if (text.length > 20) { console.log(`Groq ✅ ${model}`); return text }
    } catch (e) { console.log(`Groq ${model} err: ${e}`) }
  }
  return null
}

// ── Provider 2: Gemini (FREE 1500/day) ───────────────────────────────────────
async function tryGemini(prompt: string, apiKey: string): Promise<string | null> {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite']
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT(prompt) }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
          }),
        }
      )
      if (res.status === 429) { console.log(`Gemini ${model}: rate limited`); continue }
      if (!res.ok) { console.log(`Gemini ${model}: ${res.status}`); continue }
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (text.length > 20) { console.log(`Gemini ✅ ${model}`); return text }
    } catch (e) { console.log(`Gemini ${model} err: ${e}`) }
  }
  return null
}

// ── Provider 3: OpenRouter (FREE models) ─────────────────────────────────────
async function tryOpenRouter(prompt: string, apiKey: string): Promise<string | null> {
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-8b:free',
    'qwen/qwen3-14b:free',
    'qwen/qwen-2.5-72b-instruct:free',
  ]
  for (const model of models) {
    try {
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
          messages: [{ role: 'user', content: PROMPT(prompt) }],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })
      if (res.status === 429 || res.status === 404 || res.status === 503) {
        console.log(`OR ${model}: ${res.status}`); continue
      }
      if (!res.ok) { console.log(`OR ${model}: ${res.status}`); continue }
      const data = await res.json()
      let text = data?.choices?.[0]?.message?.content || ''
      text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
      if (text.length > 20) { console.log(`OR ✅ ${model}`); return text }
    } catch (e) { console.log(`OR ${model} err: ${e}`) }
  }
  return null
}

// ── Main ──────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const groqKey = process.env.GROQ_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    const orKey = process.env.OPENROUTER_API_KEY

    if (!groqKey && !geminiKey && !orKey) {
      return NextResponse.json({ error: 'NO_API_KEY' }, { status: 500 })
    }

    console.log(`[ai] prompt="${prompt}" groq=${!!groqKey} gemini=${!!geminiKey} or=${!!orKey}`)

    let raw: string | null = null

    // Priority: Groq → Gemini → OpenRouter
    if (!raw && groqKey)   raw = await tryGroq(prompt, groqKey)
    if (!raw && geminiKey) raw = await tryGemini(prompt, geminiKey)
    if (!raw && orKey)     raw = await tryOpenRouter(prompt, orKey)

    if (!raw) {
      return NextResponse.json({ error: 'ALL_FAILED', detail: 'All AI providers failed' }, { status: 502 })
    }

    const config = extractJson(raw)
    if (!config) {
      console.error('[ai] parse failed:', raw.slice(0, 300))
      return NextResponse.json({ error: 'PARSE_FAILED' }, { status: 502 })
    }

    console.log('[ai] ✅ done')
    return NextResponse.json({ config })

  } catch (err) {
    console.error('[ai] error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: String(err) }, { status: 500 })
  }
}
