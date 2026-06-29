import { NextRequest, NextResponse } from 'next/server'

// Detailed prompt based on real YouTube thumbnail examples
const buildPrompt = (topic: string, style: string, lang: string) => `You are an expert YouTube thumbnail designer from Bangladesh. You have studied thousands of viral thumbnails.

TOPIC: "${topic}"
STYLE: ${style}
TEXT LANGUAGE: ${lang}

Analyze the topic and create a HIGHLY ENGAGING thumbnail config. Study these patterns from viral thumbnails:
- Income/Money: Dark background + HUGE gold/yellow text + money emoji 💸💰
- Tech/AI: Deep purple/blue gradient + glowing text + robot/tech emoji 🤖⚡
- Travel: Green/nature gradient + exciting headline + travel emoji ✈️🚂
- Food: Red/orange gradient + appetizing description + food emoji 🍜🔥  
- Horror: Pure black + red glowing text + scary emoji 👻😱
- Review/Product: Indigo gradient + credibility text + star emoji ⭐✅
- Sports/Highlights: Dark with team colors + CAPS text + sport emoji ⚽🏆
- Gaming/Setup: Purple/pink gradient + bold English + gaming emoji 🎮💻
- Tutorial/How-to: Clean dark + step text + arrow/check emoji 📚✅
- Business/Entrepreneur: Black gold + success text + fire emoji 🔥💼

FONT RULES (choose based on content):
- Bengali content → use "Noto Sans Bengali" or "Baloo Da 2"  
- English bold titles → use "Anton" or "Bebas Neue" or "Bangers"
- Mixed content → English title with "Anton", Bengali subtitle with "Noto Sans Bengali"

Return ONLY a valid JSON object (no markdown, no explanation):

{
  "backgroundType": "gradient",
  "gradientFrom": "#COLOR",
  "gradientTo": "#COLOR",
  "gradientDirection": "135deg",
  "hasFrame": true/false,
  "frameColor": "#COLOR",
  "frameWidth": 4,
  "hasLogo": true,
  "logoText": "SHORT CHANNEL NAME",
  "logoX": 40,
  "logoY": 40,
  "logoSize": 36,
  "hasTag": true/false,
  "tagText": "HOT TAG or empty",
  "tagColor": "#FF0000",
  "textLayers": [
    {
      "id": "main",
      "text": "COMPELLING HEADLINE - ${lang === 'bangla' ? 'in Bengali script' : lang === 'english' ? 'in English' : 'mix Bengali and English naturally'}",
      "x": 50,
      "y": 140,
      "fontSize": 100,
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
      "fontFamily": "CHOOSE APPROPRIATE FONT",
      "uppercase": false,
      "outline": false,
      "glow": false,
      "glowColor": "#FFD700"
    },
    {
      "id": "sub",
      "text": "SUPPORTING TEXT with relevant emoji",
      "x": 50,
      "y": 280,
      "fontSize": 60,
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

CRITICAL RULES:
1. Make text PUNCHY and SHORT (3-7 words max per layer)
2. Add relevant emoji at end of text  
3. Use CONTRASTING colors - text must be visible on background
4. For Bengali content: use "Noto Sans Bengali" or "Baloo Da 2" fonts
5. For English content: use "Anton" or "Bebas Neue" fonts
6. Make it look like a VIRAL thumbnail - exciting, clickable
7. Return ONLY the JSON, nothing else`

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

async function tryGroq(prompt: string, style: string, lang: string, apiKey: string): Promise<string | null> {
  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it']
  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: buildPrompt(prompt, style, lang) }],
          max_tokens: 1500,
          temperature: 0.8,
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

async function tryGemini(prompt: string, style: string, lang: string, apiKey: string): Promise<string | null> {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite']
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildPrompt(prompt, style, lang) }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
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

async function tryOpenRouter(prompt: string, style: string, lang: string, apiKey: string): Promise<string | null> {
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-14b:free',
    'qwen/qwen3-8b:free',
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
          messages: [{ role: 'user', content: buildPrompt(prompt, style, lang) }],
          max_tokens: 1500,
          temperature: 0.8,
        }),
      })
      if (res.status === 429 || res.status === 404 || res.status === 503) { console.log(`OR ${model}: ${res.status}`); continue }
      if (!res.ok) { console.log(`OR ${model}: ${res.status}`); continue }
      const data = await res.json()
      let text = data?.choices?.[0]?.message?.content || ''
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      if (text.length > 20) { console.log(`OR ✅ ${model}`); return text }
    } catch (e) { console.log(`OR ${model} err: ${e}`) }
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

    if (!groqKey && !geminiKey && !orKey) {
      return NextResponse.json({ error: 'NO_API_KEY' }, { status: 500 })
    }

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
