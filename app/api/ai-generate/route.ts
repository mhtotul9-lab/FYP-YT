import { NextRequest, NextResponse } from 'next/server'

const buildPrompt = (topic: string, style: string, lang: string) => `You are a professional viral YouTube thumbnail designer. Study these real viral thumbnail patterns:

VIRAL THUMBNAIL RULES:
1. TEXT must be SHORT (3-7 words) but POWERFUL and create curiosity/urgency
2. Use CONTRASTING colors - light text on dark background or vice versa
3. LARGE main text (fontSize 90-130) + smaller subtitle (fontSize 50-70)
4. Add relevant emoji to make it pop
5. Strong STROKE on text so it's readable on any background

TOPIC: "${topic}"
STYLE CATEGORY: ${style}
LANGUAGE: ${lang === 'bangla' ? 'Write ALL text in Bengali (বাংলা) script' : lang === 'english' ? 'Write ALL text in English, use bold impactful words' : 'Mix Bengali and English naturally - English for power words, Bengali for context'}

DESIGN RULES BY CATEGORY:
income/money: bg "#1a1a1a"→"#2d1f00", main text color "#FFD700", subtitle "#FFFFFF", frame "#FFD700", hasFrame true, glow true on main, use Anton font for English / Noto Sans Bengali for Bengali
tech/ai: bg "#050520"→"#1a0545", main text gradient from "#A855F7" to "#06B6D4", glow true glowColor "#7C3AED", frame "#7C3AED"
travel: bg "#052e16"→"#14532d", main "#FFFFFF", subtitle "#BBF7D0", frame "#22C55E" 
food: bg "#450a0a"→"#991b1b", main "#FFFFFF", subtitle "#FDE68A", frame "#EF4444"
horror: bg "#000000"→"#1a0000", main "#FF0000" glow true glowColor "#DC2626", frame "#DC2626", subtitle "#FFFFFF"
sports: bg "#0c1445"→"#1e3a8a", main "#FFFF00", subtitle "#FFFFFF", frame "#3B82F6", hasTag true
gaming: bg "#1a0033"→"#4a0080", main gradient "#FF00FF"→"#00FFFF", glow true glowColor "#FF00FF", frame "#A855F7"
review: bg "#1e1b4b"→"#312e81", main "#FFFFFF", subtitle "#FCD34D", frame "#818CF8"
tutorial: bg "#0f172a"→"#1e3a5f", main "#FFFFFF", subtitle "#93C5FD", frame "#3B82F6"
auto: detect from topic and use most appropriate above

Return ONLY this JSON (absolutely no markdown, no text outside JSON):
{
  "backgroundType": "gradient",
  "gradientFrom": "#050520",
  "gradientTo": "#1a0545",
  "gradientDirection": "135deg",
  "hasFrame": true,
  "frameColor": "#7C3AED",
  "frameWidth": 5,
  "hasLogo": true,
  "logoText": "FYP King",
  "logoX": 40,
  "logoY": 40,
  "logoSize": 36,
  "hasTag": false,
  "tagText": "",
  "tagColor": "#FF0000",
  "textLayers": [
    {
      "id": "main",
      "text": "POWERFUL HEADLINE HERE",
      "x": 55,
      "y": 150,
      "fontSize": 105,
      "fontWeight": "900",
      "color": "#FFFFFF",
      "strokeColor": "#000000",
      "strokeWidth": 5,
      "shadowColor": "#000000",
      "shadowBlur": 25,
      "rotation": 0,
      "gradient": false,
      "gradientFrom": "#FFD700",
      "gradientTo": "#FF6B35",
      "align": "left",
      "fontFamily": "Noto Sans Bengali",
      "uppercase": false,
      "outline": false,
      "glow": false,
      "glowColor": "#7C3AED"
    },
    {
      "id": "sub",
      "text": "Supporting subtitle with emoji 🔥",
      "x": 55,
      "y": 295,
      "fontSize": 58,
      "fontWeight": "700",
      "color": "#FFD700",
      "strokeColor": "#000000",
      "strokeWidth": 3,
      "shadowColor": "#000000",
      "shadowBlur": 15,
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

FONT GUIDE: 
- Bengali text → "Noto Sans Bengali" or "Baloo Da 2" or "Galada"
- English bold → "Anton" or "Bebas Neue" or "Bangers" or "Oswald"
- Mixed → main layer "Anton", subtitle "Noto Sans Bengali"

Make it VIRAL and CLICKABLE! Return only JSON.`

function extractJson(raw: string): object | null {
  try {
    let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fence) s = fence[1].trim()
    const b1 = s.indexOf('{'), b2 = s.lastIndexOf('}')
    if (b1 === -1 || b2 === -1) return null
    const cfg = JSON.parse(s.slice(b1, b2 + 1))
    return cfg.textLayers ? cfg : null
  } catch { return null }
}

async function tryGroq(prompt: string, style: string, lang: string, key: string): Promise<string | null> {
  for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it']) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: buildPrompt(prompt, style, lang) }], max_tokens: 1500, temperature: 0.8 }),
      })
      if (!res.ok) { console.log(`Groq ${model}: ${res.status}`); continue }
      const d = await res.json()
      const t = d?.choices?.[0]?.message?.content || ''
      if (t.length > 20) { console.log(`Groq ✅ ${model}`); return t }
    } catch (e) { console.log(`Groq err: ${e}`) }
  }
  return null
}

async function tryGemini(prompt: string, style: string, lang: string, key: string): Promise<string | null> {
  for (const model of ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(prompt, style, lang) }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 1500 } }),
      })
      if (!res.ok) { console.log(`Gemini ${model}: ${res.status}`); continue }
      const d = await res.json()
      const t = d?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (t.length > 20) { console.log(`Gemini ✅ ${model}`); return t }
    } catch (e) { console.log(`Gemini err: ${e}`) }
  }
  return null
}

async function tryOpenRouter(prompt: string, style: string, lang: string, key: string): Promise<string | null> {
  for (const model of ['meta-llama/llama-3.3-70b-instruct:free', 'qwen/qwen3-14b:free', 'qwen/qwen3-8b:free']) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'HTTP-Referer': 'https://fyp-yt.vercel.app', 'X-Title': 'Bangla Thumbnail Generator' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: buildPrompt(prompt, style, lang) }], max_tokens: 1500, temperature: 0.8 }),
      })
      if (res.status === 429 || res.status === 404) { continue }
      if (!res.ok) { console.log(`OR ${model}: ${res.status}`); continue }
      const d = await res.json()
      let t = d?.choices?.[0]?.message?.content || ''
      t = t.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      if (t.length > 20) { console.log(`OR ✅ ${model}`); return t }
    } catch (e) { console.log(`OR err: ${e}`) }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, style = 'auto', lang = 'bangla' } = await request.json()
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

    const groqKey = process.env.GROQ_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    const orKey = process.env.OPENROUTER_API_KEY

    if (!groqKey && !geminiKey && !orKey) return NextResponse.json({ error: 'NO_API_KEY' }, { status: 500 })

    console.log(`[ai] "${prompt}" style=${style} lang=${lang}`)

    let raw: string | null = null
    if (!raw && groqKey)   raw = await tryGroq(prompt, style, lang, groqKey)
    if (!raw && geminiKey) raw = await tryGemini(prompt, style, lang, geminiKey)
    if (!raw && orKey)     raw = await tryOpenRouter(prompt, style, lang, orKey)

    if (!raw) return NextResponse.json({ error: 'ALL_FAILED' }, { status: 502 })
    const config = extractJson(raw)
    if (!config) return NextResponse.json({ error: 'PARSE_FAILED' }, { status: 502 })

    return NextResponse.json({ config })
  } catch (err) {
    return NextResponse.json({ error: 'INTERNAL_ERROR', detail: String(err) }, { status: 500 })
  }
}
