'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface TextLayer {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontWeight: string
  color: string
  strokeColor: string
  strokeWidth: number
  shadowColor: string
  shadowBlur: number
  rotation: number
  gradient: boolean
  gradientFrom: string
  gradientTo: string
  align: 'left' | 'center' | 'right'
  fontFamily: string
  uppercase: boolean
  outline: boolean
  glow: boolean
  glowColor: string
}

interface ThumbnailConfig {
  width: number
  height: number
  background: string
  backgroundType: 'solid' | 'gradient' | 'image'
  gradientFrom: string
  gradientTo: string
  gradientDirection: string
  bgImage: string | null
  bgOverlay: boolean
  bgOverlayColor: string
  bgOverlayOpacity: number
  textLayers: TextLayer[]
  template: string
  hasLogo: boolean
  logoText: string
  logoX: number
  logoY: number
  logoSize: number
  hasTag: boolean
  tagText: string
  tagColor: string
  hasBadge: boolean
  badgeText: string
  personImage: string | null
  personX: number
  personY: number
  personScale: number
  decorElements: string[]
  hasFrame: boolean
  frameColor: string
  frameWidth: number
}

// ─── Sizes ───────────────────────────────────────────────────────────────────
const SIZES = [
  { label: 'YouTube (1280×720)', w: 1280, h: 720 },
  { label: 'YouTube Shorts (1080×1920)', w: 1080, h: 1920 },
  { label: 'Facebook (1200×628)', w: 1200, h: 628 },
  { label: 'Instagram Post (1080×1080)', w: 1080, h: 1080 },
  { label: 'Instagram Story (1080×1920)', w: 1080, h: 1920 },
  { label: 'Twitter/X (1200×675)', w: 1200, h: 675 },
  { label: 'LinkedIn (1200×627)', w: 1200, h: 627 },
  { label: 'TikTok (1080×1920)', w: 1080, h: 1920 },
]

// ─── Templates ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'tech',
    name: '⚡ টেক/AI',
    config: {
      backgroundType: 'gradient' as const,
      gradientFrom: '#0a0a2e',
      gradientTo: '#1a0a3e',
      gradientDirection: '135deg',
      bgOverlay: false,
      bgOverlayColor: '#000000',
      bgOverlayOpacity: 0.5,
      frameColor: '#7C3AED',
      frameWidth: 4,
      hasFrame: true,
      textLayers: [
        { id: 'title', text: 'AI দিয়ে তৈরি করুন', x: 50, y: 180, fontSize: 90, fontWeight: '900', color: '#FFFFFF', strokeColor: '#7C3AED', strokeWidth: 3, shadowColor: '#7C3AED', shadowBlur: 20, rotation: 0, gradient: true, gradientFrom: '#A855F7', gradientTo: '#06B6D4', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: true, glowColor: '#7C3AED' },
        { id: 'sub', text: 'সম্পূর্ণ বিনামূল্যে!', x: 50, y: 320, fontSize: 55, fontWeight: '700', color: '#FFD700', strokeColor: '#000000', strokeWidth: 2, shadowColor: '#000000', shadowBlur: 10, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FFD700' },
      ],
    },
  },
  {
    id: 'travel',
    name: '✈️ ট্রাভেল',
    config: {
      backgroundType: 'gradient' as const,
      gradientFrom: '#064e3b',
      gradientTo: '#065f46',
      gradientDirection: '180deg',
      bgOverlay: false,
      bgOverlayColor: '#000000',
      bgOverlayOpacity: 0.4,
      frameColor: '#10B981',
      frameWidth: 5,
      hasFrame: true,
      textLayers: [
        { id: 'title', text: 'বনলতা এক্সপ্রেস', x: 50, y: 200, fontSize: 95, fontWeight: '900', color: '#FFFFFF', strokeColor: '#065f46', strokeWidth: 4, shadowColor: '#000000', shadowBlur: 15, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#10B981' },
        { id: 'sub', text: 'ট্রেনে রাজশাহী ভ্রমণ 🚂', x: 50, y: 330, fontSize: 60, fontWeight: '700', color: '#FFD700', strokeColor: '#000000', strokeWidth: 2, shadowColor: '#000000', shadowBlur: 10, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FFD700' },
      ],
    },
  },
  {
    id: 'money',
    name: '💰 ইনকাম',
    config: {
      backgroundType: 'gradient' as const,
      gradientFrom: '#1a1a1a',
      gradientTo: '#2d1f00',
      gradientDirection: '135deg',
      bgOverlay: false,
      bgOverlayColor: '#000000',
      bgOverlayOpacity: 0.5,
      frameColor: '#FFD700',
      frameWidth: 5,
      hasFrame: true,
      textLayers: [
        { id: 'title', text: 'শুরু করলেই', x: 60, y: 150, fontSize: 100, fontWeight: '900', color: '#FFFFFF', strokeColor: '#000000', strokeWidth: 4, shadowColor: '#000000', shadowBlur: 20, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FFD700' },
        { id: 'highlight', text: 'টাকা আসে! 💸', x: 60, y: 280, fontSize: 105, fontWeight: '900', color: '#FFD700', strokeColor: '#8B6500', strokeWidth: 4, shadowColor: '#000000', shadowBlur: 15, rotation: 0, gradient: true, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: true, glowColor: '#FFD700' },
      ],
    },
  },
  {
    id: 'food',
    name: '🍜 খাবার',
    config: {
      backgroundType: 'gradient' as const,
      gradientFrom: '#7f1d1d',
      gradientTo: '#dc2626',
      gradientDirection: '135deg',
      bgOverlay: false,
      bgOverlayColor: '#000000',
      bgOverlayOpacity: 0.4,
      frameColor: '#FCA5A5',
      frameWidth: 4,
      hasFrame: true,
      textLayers: [
        { id: 'title', text: 'চলতি রান্না', x: 50, y: 160, fontSize: 110, fontWeight: '900', color: '#FFFFFF', strokeColor: '#7f1d1d', strokeWidth: 4, shadowColor: '#000000', shadowBlur: 20, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FCA5A5' },
        { id: 'sub', text: 'সেরা রেসিপি ২০২৫ 🔥', x: 50, y: 290, fontSize: 60, fontWeight: '700', color: '#FDE68A', strokeColor: '#000000', strokeWidth: 2, shadowColor: '#000000', shadowBlur: 8, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FCA5A5' },
      ],
    },
  },
  {
    id: 'review',
    name: '⭐ রিভিউ',
    config: {
      backgroundType: 'gradient' as const,
      gradientFrom: '#1e1b4b',
      gradientTo: '#312e81',
      gradientDirection: '135deg',
      bgOverlay: false,
      bgOverlayColor: '#000000',
      bgOverlayOpacity: 0.5,
      frameColor: '#818CF8',
      frameWidth: 5,
      hasFrame: false,
      textLayers: [
        { id: 'label', text: 'রিয়েল রিভিউ ✅', x: 50, y: 120, fontSize: 50, fontWeight: '700', color: '#A5F3FC', strokeColor: '#000000', strokeWidth: 2, shadowColor: '#000000', shadowBlur: 10, rotation: 0, gradient: false, gradientFrom: '#818CF8', gradientTo: '#A5F3FC', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#818CF8' },
        { id: 'title', text: 'সেরা প্রোডাক্ট', x: 50, y: 220, fontSize: 100, fontWeight: '900', color: '#FFFFFF', strokeColor: '#1e1b4b', strokeWidth: 3, shadowColor: '#818CF8', shadowBlur: 20, rotation: 0, gradient: true, gradientFrom: '#FFFFFF', gradientTo: '#A5B4FC', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#818CF8' },
        { id: 'sub', text: '২০২৫ সালের সেরা পিক!', x: 50, y: 355, fontSize: 55, fontWeight: '600', color: '#FCD34D', strokeColor: '#000000', strokeWidth: 2, shadowColor: '#000000', shadowBlur: 8, rotation: 0, gradient: false, gradientFrom: '#FCD34D', gradientTo: '#F59E0B', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FCD34D' },
      ],
    },
  },
  {
    id: 'horror',
    name: '👻 হরর',
    config: {
      backgroundType: 'gradient' as const,
      gradientFrom: '#000000',
      gradientTo: '#1a0000',
      gradientDirection: '180deg',
      bgOverlay: false,
      bgOverlayColor: '#000000',
      bgOverlayOpacity: 0.6,
      frameColor: '#DC2626',
      frameWidth: 6,
      hasFrame: true,
      textLayers: [
        { id: 'title', text: '😱 সত্যিকারের', x: 50, y: 180, fontSize: 95, fontWeight: '900', color: '#FFFFFF', strokeColor: '#DC2626', strokeWidth: 4, shadowColor: '#DC2626', shadowBlur: 30, rotation: 0, gradient: false, gradientFrom: '#DC2626', gradientTo: '#7F1D1D', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: true, glowColor: '#DC2626' },
        { id: 'sub', text: 'ভুতের গল্প!', x: 50, y: 320, fontSize: 110, fontWeight: '900', color: '#DC2626', strokeColor: '#000000', strokeWidth: 4, shadowColor: '#000000', shadowBlur: 15, rotation: 0, gradient: true, gradientFrom: '#DC2626', gradientTo: '#FF0000', align: 'left' as const, fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: true, glowColor: '#DC2626' },
      ],
    },
  },
]

// ─── Default Config ───────────────────────────────────────────────────────────
const defaultConfig: ThumbnailConfig = {
  width: 1280,
  height: 720,
  background: '#1a1a2e',
  backgroundType: 'gradient',
  gradientFrom: '#1a1a2e',
  gradientTo: '#16213e',
  gradientDirection: '135deg',
  bgImage: null,
  bgOverlay: true,
  bgOverlayColor: '#000000',
  bgOverlayOpacity: 0.4,
  textLayers: [
    { id: 'main', text: 'আপনার থাম্বনেইল টেক্সট', x: 60, y: 200, fontSize: 100, fontWeight: '900', color: '#FFFFFF', strokeColor: '#000000', strokeWidth: 4, shadowColor: '#000000', shadowBlur: 20, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left', fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FFD700' },
    { id: 'sub', text: 'সাবটাইটেল এখানে', x: 60, y: 340, fontSize: 60, fontWeight: '700', color: '#FFD700', strokeColor: '#000000', strokeWidth: 2, shadowColor: '#000000', shadowBlur: 10, rotation: 0, gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35', align: 'left', fontFamily: 'Noto Sans Bengali', uppercase: false, outline: false, glow: false, glowColor: '#FFD700' },
  ],
  template: 'tech',
  hasLogo: true,
  logoText: 'চলতি',
  logoX: 40,
  logoY: 40,
  logoSize: 40,
  hasTag: false,
  tagText: 'নতুন',
  tagColor: '#FF0000',
  hasBadge: false,
  badgeText: 'VIRAL',
  personImage: null,
  personX: 700,
  personY: 0,
  personScale: 1,
  decorElements: [],
  hasFrame: false,
  frameColor: '#FFD700',
  frameWidth: 6,
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────
async function renderThumbnail(canvas: HTMLCanvasElement, config: ThumbnailConfig, scale = 1): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = config.width * scale
  const H = config.height * scale
  canvas.width = W
  canvas.height = H
  await document.fonts.ready

  // Background
  if (config.backgroundType === 'image' && config.bgImage) {
    await new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const ar = img.width / img.height
        const ca = W / H
        let dW, dH, dX, dY
        if (ar > ca) { dH = H; dW = H * ar; dX = (W - dW) / 2; dY = 0 }
        else { dW = W; dH = W / ar; dX = 0; dY = (H - dH) / 2 }
        ctx.drawImage(img, dX, dY, dW, dH)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = config.bgImage!
    })
  } else if (config.backgroundType === 'gradient') {
    const angle = parseFloat(config.gradientDirection?.replace('deg', '') || '135') * (Math.PI / 180)
    const x1 = W / 2 - (Math.cos(angle) * W) / 2
    const y1 = H / 2 - (Math.sin(angle) * H) / 2
    const x2 = W / 2 + (Math.cos(angle) * W) / 2
    const y2 = H / 2 + (Math.sin(angle) * H) / 2
    const grad = ctx.createLinearGradient(x1, y1, x2, y2)
    grad.addColorStop(0, config.gradientFrom)
    grad.addColorStop(1, config.gradientTo)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  } else {
    ctx.fillStyle = config.background
    ctx.fillRect(0, 0, W, H)
  }

  if (config.bgOverlay && config.backgroundType === 'image') {
    ctx.save(); ctx.globalAlpha = config.bgOverlayOpacity
    ctx.fillStyle = config.bgOverlayColor; ctx.fillRect(0, 0, W, H); ctx.restore()
  }

  // Diagonal stripe decoration
  ctx.save(); ctx.globalAlpha = 0.04
  for (let i = -H; i < W + H; i += 60) {
    ctx.fillStyle = '#ffffff'; ctx.beginPath()
    ctx.moveTo(i, 0); ctx.lineTo(i + 30, 0)
    ctx.lineTo(i + 30 - H, H); ctx.lineTo(i - H, H)
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()

  // Person image
  if (config.personImage) {
    await new Promise<void>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const tH = H * config.personScale
        const tW = (img.width / img.height) * tH
        ctx.drawImage(img, config.personX * scale, config.personY * scale, tW, tH)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = config.personImage!
    })
  }

  // Text layers
  for (const layer of config.textLayers) {
    ctx.save()
    const fs = layer.fontSize * scale
    ctx.font = `${layer.fontWeight} ${fs}px '${layer.fontFamily}', 'Noto Sans Bengali', sans-serif`
    const x = layer.x * scale
    const y = layer.y * scale
    ctx.translate(x, y)
    ctx.rotate((layer.rotation * Math.PI) / 180)
    ctx.textAlign = layer.align
    ctx.textBaseline = 'top'
    const text = layer.uppercase ? layer.text.toUpperCase() : layer.text
    if (layer.glow) { ctx.shadowColor = layer.glowColor; ctx.shadowBlur = 25 * scale }
    ctx.shadowColor = layer.shadowColor
    ctx.shadowBlur = layer.shadowBlur * scale
    ctx.shadowOffsetX = 3 * scale
    ctx.shadowOffsetY = 3 * scale
    if (layer.gradient) {
      const tw = ctx.measureText(text).width
      const tg = ctx.createLinearGradient(0, 0, tw, fs)
      tg.addColorStop(0, layer.gradientFrom); tg.addColorStop(1, layer.gradientTo)
      ctx.fillStyle = tg
    } else { ctx.fillStyle = layer.color }
    if (layer.strokeWidth > 0) {
      ctx.lineWidth = layer.strokeWidth * scale
      ctx.strokeStyle = layer.strokeColor
      ctx.lineJoin = 'round'
      ctx.strokeText(text, 0, 0)
    }
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }

  // Logo
  if (config.hasLogo && config.logoText) {
    ctx.save()
    const lx = config.logoX * scale, ly = config.logoY * scale
    const ls = config.logoSize * scale, pad = 12 * scale
    ctx.font = `bold ${ls}px 'Noto Sans Bengali', sans-serif`
    const tw = ctx.measureText(config.logoText).width
    const bW = tw + pad * 2, bH = ls + pad * 1.5
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath(); ctx.roundRect(lx, ly, bW, bH, 8 * scale); ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5 * scale; ctx.stroke()
    ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'
    ctx.fillText(config.logoText, lx + pad, ly + bH / 2)
    ctx.restore()
  }

  // Tag
  if (config.hasTag && config.tagText) {
    ctx.save()
    const tx = 60 * scale, ty = (config.height - 120) * scale
    const th = 60 * scale, tfs = 34 * scale
    ctx.font = `bold ${tfs}px 'Noto Sans Bengali', sans-serif`
    const tw = ctx.measureText(config.tagText).width
    const tW2 = tw + 40 * scale
    ctx.fillStyle = config.tagColor
    ctx.beginPath(); ctx.roundRect(tx, ty, tW2, th, 6 * scale); ctx.fill()
    ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4
    ctx.fillText(config.tagText, tx + tW2 / 2, ty + th / 2)
    ctx.restore()
  }

  // Frame
  if (config.hasFrame) {
    ctx.save()
    ctx.strokeStyle = config.frameColor
    ctx.lineWidth = config.frameWidth * scale
    ctx.strokeRect(config.frameWidth * scale, config.frameWidth * scale, W - config.frameWidth * 2 * scale, H - config.frameWidth * 2 * scale)
    ctx.restore()
  }

  // Corner accent
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#FFFFFF'
  ctx.beginPath(); ctx.moveTo(W - 80 * scale, H); ctx.lineTo(W, H - 80 * scale)
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.restore()
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const personInputRef = useRef<HTMLInputElement>(null)

  const [config, setConfig] = useState<ThumbnailConfig>({
    ...defaultConfig,
    ...TEMPLATES[0].config,
  })
  const [selectedSize, setSelectedSize] = useState(0)
  const [selectedLayer, setSelectedLayer] = useState(0)
  const [activeTab, setActiveTab] = useState<'ai' | 'template' | 'text' | 'bg' | 'elements'>('ai')
  const [isRendering, setIsRendering] = useState(false)
  const [previewScale, setPreviewScale] = useState(0.4)

  // AI states
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState(false)

  const PREVIEW_SCALE = previewScale

  // Apply template
  const applyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setConfig(prev => ({
      ...prev,
      backgroundType: tmpl.config.backgroundType,
      gradientFrom: tmpl.config.gradientFrom,
      gradientTo: tmpl.config.gradientTo,
      gradientDirection: tmpl.config.gradientDirection,
      bgOverlay: tmpl.config.bgOverlay,
      bgOverlayColor: tmpl.config.bgOverlayColor,
      bgOverlayOpacity: tmpl.config.bgOverlayOpacity,
      frameColor: tmpl.config.frameColor,
      frameWidth: tmpl.config.frameWidth,
      hasFrame: tmpl.config.hasFrame,
      textLayers: JSON.parse(JSON.stringify(tmpl.config.textLayers)),
      template: tmpl.id,
    }))
  }

  // Render preview
  const renderPreview = useCallback(async () => {
    const canvas = previewRef.current
    if (!canvas) return
    await renderThumbnail(canvas, config, PREVIEW_SCALE)
  }, [config, PREVIEW_SCALE])

  useEffect(() => { renderPreview() }, [renderPreview])

  // Download
  const handleDownload = async () => {
    setIsRendering(true)
    const canvas = canvasRef.current
    if (!canvas) return
    await renderThumbnail(canvas, config, 1)
    const link = document.createElement('a')
    link.download = `bangla-thumbnail-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
    setIsRendering(false)
  }

  // ─── AI Generate ─────────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiSuccess(false)

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      const data = await response.json()
      console.log('API response:', response.status, data)

      if (!response.ok || data.error) {
        if (data.error === 'NO_API_KEY') {
          throw new Error('NO_API_KEY')
        }
        if (data.error === 'ANTHROPIC_ERROR') {
          throw new Error('ANTHROPIC_ERROR:' + (data.status || '') + ':' + (data.detail || ''))
        }
        throw new Error(data.error || 'Server error')
      }

      const aiConfig = data.config

      setConfig(prev => ({
        ...prev,
        backgroundType: aiConfig.backgroundType || 'gradient',
        gradientFrom: aiConfig.gradientFrom || prev.gradientFrom,
        gradientTo: aiConfig.gradientTo || prev.gradientTo,
        gradientDirection: aiConfig.gradientDirection || '135deg',
        hasFrame: aiConfig.hasFrame ?? false,
        frameColor: aiConfig.frameColor || '#FFD700',
        frameWidth: aiConfig.frameWidth || 5,
        hasLogo: aiConfig.hasLogo ?? true,
        logoText: aiConfig.logoText || prev.logoText,
        logoX: aiConfig.logoX || 40,
        logoY: aiConfig.logoY || 40,
        logoSize: aiConfig.logoSize || 38,
        hasTag: aiConfig.hasTag ?? false,
        tagText: aiConfig.tagText || '',
        tagColor: aiConfig.tagColor || '#FF0000',
        textLayers: Array.isArray(aiConfig.textLayers) && aiConfig.textLayers.length > 0
          ? aiConfig.textLayers
          : prev.textLayers,
      }))

      setAiSuccess(true)
      setActiveTab('template')
      setTimeout(() => setAiSuccess(false), 4000)
    } catch (err: unknown) {
      console.error('AI generate error:', err)
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'NO_API_KEY') {
        setAiError('NO_API_KEY')
      } else if (msg.startsWith('ANTHROPIC_ERROR')) {
        setAiError('ANTHROPIC_ERROR:' + msg)
      } else {
        setAiError('GENERAL_ERROR:' + msg)
      }
    } finally {
      setAiLoading(false)
    }
  }

  // Update layer
  // Update layer
  const updateLayer = (idx: number, updates: Partial<TextLayer>) => {
    setConfig(prev => {
      const layers = [...prev.textLayers]
      layers[idx] = { ...layers[idx], ...updates }
      return { ...prev, textLayers: layers }
    })
  }

  // Add layer
  const addLayer = () => {
    const newLayer: TextLayer = {
      id: `layer-${Date.now()}`,
      text: 'নতুন টেক্সট',
      x: 100, y: 400, fontSize: 70, fontWeight: '700',
      color: '#FFFFFF', strokeColor: '#000000', strokeWidth: 2,
      shadowColor: '#000000', shadowBlur: 10, rotation: 0,
      gradient: false, gradientFrom: '#FFD700', gradientTo: '#FF6B35',
      align: 'left', fontFamily: 'Noto Sans Bengali',
      uppercase: false, outline: false, glow: false, glowColor: '#FFD700',
    }
    setConfig(prev => ({ ...prev, textLayers: [...prev.textLayers, newLayer] }))
    setSelectedLayer(config.textLayers.length)
  }

  const removeLayer = (idx: number) => {
    setConfig(prev => ({ ...prev, textLayers: prev.textLayers.filter((_, i) => i !== idx) }))
    setSelectedLayer(Math.max(0, idx - 1))
  }

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setConfig(prev => ({ ...prev, bgImage: ev.target?.result as string, backgroundType: 'image' }))
    reader.readAsDataURL(file)
  }

  const handlePersonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setConfig(prev => ({ ...prev, personImage: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const curLayer = config.textLayers[selectedLayer]
  const previewW = Math.round(config.width * PREVIEW_SCALE)
  const previewH = Math.round(config.height * PREVIEW_SCALE)

  return (
    <div style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif" }} className="min-h-screen bg-gray-950 text-white">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">🎨 বাংলা থাম্বনেইল জেনারেটর</h1>
          <p className="text-xs text-gray-400">YouTube · Facebook · Instagram · TikTok</p>
        </div>
        <button onClick={handleDownload} disabled={isRendering}
          className="btn-download px-5 py-2.5 rounded-lg font-bold text-white text-sm disabled:opacity-50">
          {isRendering ? '⏳ তৈরি হচ্ছে...' : '⬇️ ডাউনলোড PNG'}
        </button>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
          {/* Size */}
          <div className="p-3 border-b border-gray-800">
            <label className="text-xs text-gray-400 mb-1 block font-medium">📐 সাইজ সিলেক্ট করুন</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              value={selectedSize}
              onChange={e => { const idx = +e.target.value; setSelectedSize(idx); setConfig(prev => ({ ...prev, width: SIZES[idx].w, height: SIZES[idx].h })) }}>
              {SIZES.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
            </select>
            <div className="text-xs text-gray-500 mt-1 text-right">{config.width}×{config.height} px</div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800 text-xs overflow-x-auto">
            {[
              { id: 'ai', label: '🤖 AI জেনারেট' },
              { id: 'template', label: '🎨 টেমপ্লেট' },
              { id: 'text', label: '✏️ টেক্সট' },
              { id: 'bg', label: '🖼️ ব্যাকগ্রাউন্ড' },
              { id: 'elements', label: '⚙️ এলিমেন্ট' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-shrink-0 px-3 py-2.5 text-center transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">

            {/* ══ AI TAB ══════════════════════════════════════════════════════ */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                {/* Hero banner */}
                <div className="rounded-xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🤖</span>
                      <div>
                        <p className="font-black text-white text-sm">AI থাম্বনেইল মেকার</p>
                        <p className="text-xs text-purple-300">Powered by Claude AI</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-200 leading-relaxed">
                      বাংলায় আপনার ভিডিওর বিষয় লিখুন — AI নিজেই সুন্দর থাম্বনেইল ডিজাইন তৈরি করবে!
                    </p>
                  </div>
                </div>

                {/* Prompt input */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block font-medium">
                    📝 ভিডিওর বিষয় লিখুন (বাংলায়)
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder={`যেমন:\n• AI দিয়ে ইনকাম করার উপায়\n• রাজশাহীতে ট্রেনে ভ্রমণ\n• ঘরে বসে ব্যবসা শুরু করুন\n• সেরা স্মার্টফোন রিভিউ ২০২৫`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white resize-none placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                    rows={5}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAiGenerate() }}
                  />
                  <p className="text-xs text-gray-600 mt-1">Ctrl+Enter দিয়েও জেনারেট করতে পারবেন</p>
                </div>

                {/* Example prompts */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">💡 উদাহরণ ক্লিক করুন:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'AI দিয়ে টাকা ইনকাম',
                      'ঢাকা থেকে কক্সবাজার ট্রেনে',
                      'কাপড়ের ব্যবসা শুরু',
                      'সেরা ফোন রিভিউ',
                      'ভুতের সত্যি গল্প',
                      'রান্নার সহজ রেসিপি',
                      'ফ্রিল্যান্সিং শেখার গাইড',
                      'YouTube থেকে আয়',
                    ].map(ex => (
                      <button key={ex}
                        onClick={() => setAiPrompt(ex)}
                        className="px-2.5 py-1 rounded-full text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 transition-all">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {aiError === 'NO_API_KEY' && (
                  <div className="p-3 rounded-lg bg-orange-900/40 border border-orange-600 text-orange-200 text-xs space-y-2">
                    <p className="font-bold text-orange-300">⚠️ Vercel এ Gemini API Key নেই!</p>
                    <p>১. Gemini API Key নিন (ফ্রি):</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank"
                      className="block font-mono bg-black/30 p-1.5 rounded text-blue-400 underline">
                      aistudio.google.com/app/apikey
                    </a>
                    <p>২. Vercel → Settings → Environment Variables:</p>
                    <p className="font-mono bg-black/30 p-1.5 rounded">Name: GEMINI_API_KEY<br/>Value: AIza...</p>
                    <p>৩. Save → Redeploy করুন।</p>
                  </div>
                )}
                {aiError && aiError !== 'NO_API_KEY' && (
                  <div className="p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-xs space-y-1">
                    <p className="font-bold">❌ কিছু সমস্যা হয়েছে</p>
                    {aiError.includes('GEMINI_ERROR') || aiError.includes('ALL_MODELS') ? (
                      <p>Gemini API সাময়িক ব্যস্ত। ৩০ সেকেন্ড পর আবার চেষ্টা করুন।</p>
                    ) : (
                      <p className="font-mono text-xs opacity-70 break-all">{aiError}</p>
                    )}
                  </div>
                )}

                {/* Success */}
                {aiSuccess && (
                  <div className="p-3 rounded-lg bg-green-900/40 border border-green-700 text-green-300 text-xs">
                    ✅ থাম্বনেইল তৈরি হয়েছে! ডানে প্রিভিউ দেখুন।
                  </div>
                )}

                {/* Generate button */}
                <button
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full py-3.5 rounded-xl font-black text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: aiLoading ? '#4c1d95' : 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    boxShadow: aiLoading ? 'none' : '0 4px 20px rgba(124, 58, 237, 0.4)',
                  }}>
                  {aiLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      AI ডিজাইন করছে...
                    </span>
                  ) : '✨ AI দিয়ে থাম্বনেইল তৈরি করুন'}
                </button>

                <div className="border-t border-gray-800 pt-3">
                  <p className="text-xs text-gray-600 text-center">
                    AI তৈরির পরেও ✏️ টেক্সট ট্যাব থেকে পরিবর্তন করতে পারবেন
                  </p>
                </div>
              </div>
            )}

            {/* ══ TEMPLATE TAB ════════════════════════════════════════════════ */}
            {activeTab === 'template' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-medium">ক্যাটাগরি বেছে নিন:</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(tmpl => (
                    <button key={tmpl.id} onClick={() => applyTemplate(tmpl)}
                      className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${
                        config.template === tmpl.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500'
                      }`}>
                      {tmpl.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400 space-y-1">
                  <p className="font-bold text-gray-300">💡 টিপস:</p>
                  <p>• 🤖 AI ট্যাব থেকে অটো ডিজাইন করুন</p>
                  <p>• টেমপ্লেট বেছে টেক্সট পরিবর্তন করুন</p>
                  <p>• নিজের ছবি আপলোড করুন</p>
                </div>
              </div>
            )}

            {/* ══ TEXT TAB ════════════════════════════════════════════════════ */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {config.textLayers.map((l, i) => (
                    <button key={l.id} onClick={() => setSelectedLayer(i)}
                      className={`px-2 py-1 rounded text-xs font-bold ${selectedLayer === i ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                      {i + 1}. {l.text.slice(0, 8)}...
                    </button>
                  ))}
                  <button onClick={addLayer} className="px-2 py-1 rounded text-xs font-bold bg-green-800 text-green-300 hover:bg-green-700">+ যোগ করুন</button>
                </div>

                {curLayer && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">টেক্সট লিখুন (বাংলায়)</label>
                      <textarea value={curLayer.text} onChange={e => updateLayer(selectedLayer, { text: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none" rows={2} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 flex justify-between"><span>ফন্ট সাইজ</span><span className="text-white font-bold">{curLayer.fontSize}px</span></label>
                      <input type="range" min={20} max={200} value={curLayer.fontSize} onChange={e => updateLayer(selectedLayer, { fontSize: +e.target.value })} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">ফন্ট ওজন</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['400', '700', '900'].map(w => (
                          <button key={w} onClick={() => updateLayer(selectedLayer, { fontWeight: w })}
                            className={`py-1 rounded text-xs ${curLayer.fontWeight === w ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                            style={{ fontWeight: w }}>
                            {w === '400' ? 'Normal' : w === '700' ? 'Bold' : 'Black'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 flex justify-between"><span>X</span><span>{curLayer.x}</span></label>
                        <input type="range" min={0} max={config.width - 50} value={curLayer.x} onChange={e => updateLayer(selectedLayer, { x: +e.target.value })} className="w-full accent-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 flex justify-between"><span>Y</span><span>{curLayer.y}</span></label>
                        <input type="range" min={0} max={config.height - 50} value={curLayer.y} onChange={e => updateLayer(selectedLayer, { y: +e.target.value })} className="w-full accent-blue-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">লেখার রং</label>
                        <div className="flex gap-1">
                          <input type="color" value={curLayer.color} onChange={e => updateLayer(selectedLayer, { color: e.target.value })} className="w-10 h-8 rounded cursor-pointer border-0" />
                          <input value={curLayer.color} onChange={e => updateLayer(selectedLayer, { color: e.target.value })} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 text-xs text-white font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">স্ট্রোক</label>
                        <div className="flex gap-1">
                          <input type="color" value={curLayer.strokeColor} onChange={e => updateLayer(selectedLayer, { strokeColor: e.target.value })} className="w-10 h-8 rounded cursor-pointer border-0" />
                          <input type="number" min={0} max={15} value={curLayer.strokeWidth} onChange={e => updateLayer(selectedLayer, { strokeWidth: +e.target.value })} className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 text-xs text-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-gray-400">গ্রেডিয়েন্ট রং</label>
                        <input type="checkbox" checked={curLayer.gradient} onChange={e => updateLayer(selectedLayer, { gradient: e.target.checked })} className="accent-blue-500" />
                      </div>
                      {curLayer.gradient && (
                        <div className="grid grid-cols-2 gap-2">
                          <input type="color" value={curLayer.gradientFrom} onChange={e => updateLayer(selectedLayer, { gradientFrom: e.target.value })} className="w-full h-8 rounded cursor-pointer border-0" />
                          <input type="color" value={curLayer.gradientTo} onChange={e => updateLayer(selectedLayer, { gradientTo: e.target.value })} className="w-full h-8 rounded cursor-pointer border-0" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={curLayer.glow} onChange={e => updateLayer(selectedLayer, { glow: e.target.checked })} className="accent-blue-500" />
                        <label className="text-xs text-gray-400">গ্লো ইফেক্ট</label>
                      </div>
                      {curLayer.glow && <input type="color" value={curLayer.glowColor} onChange={e => updateLayer(selectedLayer, { glowColor: e.target.value })} className="w-8 h-6 rounded cursor-pointer border-0" />}
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 flex justify-between"><span>ঘোরানো</span><span>{curLayer.rotation}°</span></label>
                      <input type="range" min={-45} max={45} value={curLayer.rotation} onChange={e => updateLayer(selectedLayer, { rotation: +e.target.value })} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 flex justify-between"><span>ছায়া</span><span>{curLayer.shadowBlur}px</span></label>
                      <input type="range" min={0} max={50} value={curLayer.shadowBlur} onChange={e => updateLayer(selectedLayer, { shadowBlur: +e.target.value })} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">দ্রুত রং:</label>
                      <div className="flex gap-1 flex-wrap">
                        {['#FFFFFF', '#FFD700', '#FF0000', '#00FF00', '#00BFFF', '#FF69B4', '#FFA500', '#A855F7'].map(c => (
                          <button key={c} onClick={() => updateLayer(selectedLayer, { color: c })}
                            className="w-7 h-7 rounded-full border-2 border-gray-700 hover:border-white transition-all"
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    {config.textLayers.length > 1 && (
                      <button onClick={() => removeLayer(selectedLayer)} className="w-full py-2 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-400 text-xs font-bold transition-colors">
                        🗑️ এই লেয়ার মুছুন
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ BG TAB ══════════════════════════════════════════════════════ */}
            {activeTab === 'bg' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block font-medium">ব্যাকগ্রাউন্ড ধরন</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['solid', 'gradient', 'image'].map(t => (
                      <button key={t} onClick={() => setConfig(prev => ({ ...prev, backgroundType: t as ThumbnailConfig['backgroundType'] }))}
                        className={`py-2 rounded text-xs font-bold ${config.backgroundType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        {t === 'solid' ? '🎨 সলিড' : t === 'gradient' ? '🌈 গ্রেডিয়েন্ট' : '🖼️ ছবি'}
                      </button>
                    ))}
                  </div>
                </div>
                {config.backgroundType === 'solid' && (
                  <input type="color" value={config.background} onChange={e => setConfig(prev => ({ ...prev, background: e.target.value }))} className="w-full h-12 rounded-lg cursor-pointer border-0" />
                )}
                {config.backgroundType === 'gradient' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-gray-400 mb-1 block">রং ১</label><input type="color" value={config.gradientFrom} onChange={e => setConfig(prev => ({ ...prev, gradientFrom: e.target.value }))} className="w-full h-10 rounded-lg cursor-pointer border-0" /></div>
                      <div><label className="text-xs text-gray-400 mb-1 block">রং ২</label><input type="color" value={config.gradientTo} onChange={e => setConfig(prev => ({ ...prev, gradientTo: e.target.value }))} className="w-full h-10 rounded-lg cursor-pointer border-0" /></div>
                    </div>
                    <select value={config.gradientDirection} onChange={e => setConfig(prev => ({ ...prev, gradientDirection: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white">
                      <option value="135deg">↘ তির্যক</option>
                      <option value="180deg">↓ উপর-নিচ</option>
                      <option value="90deg">→ বাম-ডান</option>
                      <option value="45deg">↗ বিপরীত তির্যক</option>
                    </select>
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">জনপ্রিয় কম্বো:</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { from: '#0a0a2e', to: '#1a0a3e', label: 'পার্পল' },
                          { from: '#1a1a1a', to: '#2d1f00', label: 'গোল্ড' },
                          { from: '#064e3b', to: '#065f46', label: 'গ্রিন' },
                          { from: '#7f1d1d', to: '#dc2626', label: 'রেড' },
                          { from: '#1e1b4b', to: '#312e81', label: 'ইন্ডিগো' },
                          { from: '#0f172a', to: '#1e293b', label: 'স্লেট' },
                        ].map(c => (
                          <button key={c.from} onClick={() => setConfig(prev => ({ ...prev, gradientFrom: c.from, gradientTo: c.to, backgroundType: 'gradient' }))}
                            className="h-8 rounded text-xs font-bold text-white border border-gray-700"
                            style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {config.backgroundType === 'image' && (
                  <div className="space-y-3">
                    <button onClick={() => bgInputRef.current?.click()} className="w-full py-3 rounded-lg border-2 border-dashed border-gray-600 hover:border-blue-500 text-sm text-gray-400 hover:text-white transition-colors">
                      📁 ছবি আপলোড করুন
                    </button>
                    <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                    {config.bgImage && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={config.bgOverlay} onChange={e => setConfig(prev => ({ ...prev, bgOverlay: e.target.checked }))} className="accent-blue-500" />
                          <label className="text-xs text-gray-400">ডার্ক ওভারলে</label>
                        </div>
                        {config.bgOverlay && (
                          <div>
                            <label className="text-xs text-gray-400 mb-1 flex justify-between"><span>অপাসিটি</span><span>{Math.round(config.bgOverlayOpacity * 100)}%</span></label>
                            <input type="range" min={0} max={1} step={0.05} value={config.bgOverlayOpacity} onChange={e => setConfig(prev => ({ ...prev, bgOverlayOpacity: +e.target.value }))} className="w-full accent-blue-500" />
                          </div>
                        )}
                        <button onClick={() => setConfig(prev => ({ ...prev, bgImage: null, backgroundType: 'gradient' }))} className="w-full py-1.5 rounded bg-red-900/30 text-red-400 text-xs">ছবি সরান</button>
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t border-gray-800">
                  <label className="text-xs text-gray-400 mb-2 block font-medium">🧑 ব্যক্তির ছবি</label>
                  <button onClick={() => personInputRef.current?.click()} className="w-full py-2 rounded-lg border border-dashed border-gray-600 hover:border-green-500 text-xs text-gray-400 hover:text-white transition-colors">
                    📸 ছবি আপলোড করুন
                  </button>
                  <input ref={personInputRef} type="file" accept="image/*" onChange={handlePersonUpload} className="hidden" />
                  {config.personImage && (
                    <div className="mt-2 space-y-2">
                      <div><label className="text-xs text-gray-400 flex justify-between"><span>X</span><span>{config.personX}</span></label><input type="range" min={0} max={config.width} value={config.personX} onChange={e => setConfig(prev => ({ ...prev, personX: +e.target.value }))} className="w-full accent-blue-500" /></div>
                      <div><label className="text-xs text-gray-400 flex justify-between"><span>Y</span><span>{config.personY}</span></label><input type="range" min={-200} max={config.height} value={config.personY} onChange={e => setConfig(prev => ({ ...prev, personY: +e.target.value }))} className="w-full accent-blue-500" /></div>
                      <div><label className="text-xs text-gray-400 flex justify-between"><span>সাইজ</span><span>{Math.round(config.personScale * 100)}%</span></label><input type="range" min={0.2} max={2} step={0.05} value={config.personScale} onChange={e => setConfig(prev => ({ ...prev, personScale: +e.target.value }))} className="w-full accent-blue-500" /></div>
                      <button onClick={() => setConfig(prev => ({ ...prev, personImage: null }))} className="w-full py-1.5 rounded bg-red-900/30 text-red-400 text-xs">ছবি সরান</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ ELEMENTS TAB ════════════════════════════════════════════════ */}
            {activeTab === 'elements' && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={config.hasLogo} onChange={e => setConfig(prev => ({ ...prev, hasLogo: e.target.checked }))} className="accent-blue-500" />
                    <label className="text-xs text-gray-300 font-medium">চ্যানেল ট্যাগ / লোগো</label>
                  </div>
                  {config.hasLogo && (
                    <div className="space-y-2">
                      <input value={config.logoText} onChange={e => setConfig(prev => ({ ...prev, logoText: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white" placeholder="চ্যানেলের নাম..." />
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs text-gray-500">X: {config.logoX}</label><input type="range" min={0} max={600} value={config.logoX} onChange={e => setConfig(prev => ({ ...prev, logoX: +e.target.value }))} className="w-full accent-blue-500" /></div>
                        <div><label className="text-xs text-gray-500">Y: {config.logoY}</label><input type="range" min={0} max={200} value={config.logoY} onChange={e => setConfig(prev => ({ ...prev, logoY: +e.target.value }))} className="w-full accent-blue-500" /></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gray-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={config.hasTag} onChange={e => setConfig(prev => ({ ...prev, hasTag: e.target.checked }))} className="accent-blue-500" />
                    <label className="text-xs text-gray-300 font-medium">ট্যাগ ব্যাজ</label>
                  </div>
                  {config.hasTag && (
                    <div className="space-y-2">
                      <input value={config.tagText} onChange={e => setConfig(prev => ({ ...prev, tagText: e.target.value }))} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-xs text-white" placeholder="যেমন: নতুন ভিডিও, VIRAL..." />
                      <div className="flex gap-2"><label className="text-xs text-gray-500">রং:</label><input type="color" value={config.tagColor} onChange={e => setConfig(prev => ({ ...prev, tagColor: e.target.value }))} className="w-10 h-6 rounded cursor-pointer border-0" /></div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gray-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={config.hasFrame} onChange={e => setConfig(prev => ({ ...prev, hasFrame: e.target.checked }))} className="accent-blue-500" />
                    <label className="text-xs text-gray-300 font-medium">বর্ডার ফ্রেম</label>
                  </div>
                  {config.hasFrame && (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center"><label className="text-xs text-gray-500">রং:</label><input type="color" value={config.frameColor} onChange={e => setConfig(prev => ({ ...prev, frameColor: e.target.value }))} className="w-10 h-6 rounded cursor-pointer border-0" /></div>
                      <div><label className="text-xs text-gray-500">মোটা: {config.frameWidth}px</label><input type="range" min={1} max={20} value={config.frameWidth} onChange={e => setConfig(prev => ({ ...prev, frameWidth: +e.target.value }))} className="w-full accent-blue-500" /></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 bg-gray-950 flex flex-col items-center justify-center gap-4 p-4 overflow-auto">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>প্রিভিউ স্কেল:</span>
            {[0.3, 0.4, 0.5, 0.6].map(s => (
              <button key={s} onClick={() => setPreviewScale(s)}
                className={`px-2 py-0.5 rounded text-xs ${previewScale === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {Math.round(s * 100)}%
              </button>
            ))}
          </div>
          <div className="shadow-2xl rounded-lg overflow-hidden ring-1 ring-gray-700" style={{ width: previewW, height: previewH }}>
            <canvas ref={previewRef} style={{ display: 'block', width: previewW, height: previewH }} />
          </div>
          <div className="text-xs text-gray-600">{config.width} × {config.height} pixels • PNG ফরম্যাট</div>
          <button onClick={handleDownload} disabled={isRendering}
            className="btn-download px-8 py-3 rounded-xl font-bold text-white text-base disabled:opacity-50">
            {isRendering ? '⏳ তৈরি হচ্ছে...' : '⬇️ ফুল রেজোলিউশনে ডাউনলোড করুন'}
          </button>
        </div>
      </div>
    </div>
  )
}
