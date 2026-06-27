# 🎨 বাংলা থাম্বনেইল জেনারেটর

Professional YouTube / Social Media Thumbnail Generator with Bangla language support.

## ✨ Features

- 🇧🇩 সম্পূর্ণ বাংলা ভাষায় UI
- 📐 Multiple sizes: YouTube, Shorts, Instagram, Facebook, TikTok
- 🎨 6 professional templates (Tech, Travel, Money, Food, Review, Horror)
- ✏️ Multiple text layers with full control
- 🌈 Gradient backgrounds with presets
- 🖼️ Custom background image upload
- 👤 Person image overlay
- 🔤 Bangla fonts (Noto Sans Bengali)
- ⬇️ Full resolution PNG download
- 📺 Live preview with scale control

---

## 🚀 GitHub এ আপলোড করার নিয়ম

### ধাপ ১: GitHub এ নতুন Repository তৈরি করুন

1. [github.com](https://github.com) এ লগইন করুন
2. উপরে ডানদিকে **"+"** বোতাম ক্লিক করুন → **"New repository"**
3. Repository name দিন: `bangla-thumbnail-generator`
4. **Public** রাখুন
5. **"Create repository"** ক্লিক করুন

### ধাপ ২: কোড আপলোড করুন

আপনার কম্পিউটারে Terminal/Command Prompt খুলুন এবং এই commands চালান:

```bash
# প্রথমে এই ফোল্ডারে যান
cd thumbnail-generator

# Git initialize করুন
git init

# সব ফাইল add করুন
git add .

# First commit করুন
git commit -m "Initial commit: Bangla Thumbnail Generator"

# আপনার GitHub repository connect করুন
# (নিচের URL এ YOUR_USERNAME এর জায়গায় আপনার GitHub username দিন)
git remote add origin https://github.com/YOUR_USERNAME/bangla-thumbnail-generator.git

# Code push করুন
git branch -M main
git push -u origin main
```

---

## ⚡ Vercel এ Deploy করার নিয়ম

### ধাপ ১: Vercel Account তৈরি করুন
1. [vercel.com](https://vercel.com) এ যান
2. **"Sign Up"** ক্লিক করুন
3. **"Continue with GitHub"** বেছে নিন
4. GitHub account দিয়ে login করুন

### ধাপ ২: Project Import করুন
1. Vercel Dashboard এ **"Add New..."** → **"Project"** ক্লিক করুন
2. আপনার `bangla-thumbnail-generator` repository খুঁজুন
3. **"Import"** বোতাম ক্লিক করুন

### ধাপ ৩: Deploy Settings
- **Framework Preset**: Next.js (auto-detected হবে)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- কোনো Environment Variable লাগবে না
- **"Deploy"** বোতাম ক্লিক করুন

### ধাপ ৪: URL পান
- Deploy হওয়ার পর আপনি একটি URL পাবেন যেমন:
  `https://bangla-thumbnail-generator.vercel.app`
- এই URL দিয়ে যেকোনো জায়গা থেকে access করতে পারবেন!

---

## 💻 Local এ চালানোর নিয়ম

```bash
# Dependencies install করুন
npm install

# Development server চালু করুন
npm run dev

# Browser এ যান: http://localhost:3000
```

---

## 📁 Project Structure

```
thumbnail-generator/
├── app/
│   ├── globals.css      # Global styles + Bangla fonts
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main generator UI
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🔧 কাস্টমাইজেশন

### নতুন Template যোগ করতে:
`app/page.tsx` এ `TEMPLATES` array তে নতুন object যোগ করুন।

### নতুন Size যোগ করতে:
`SIZES` array তে নতুন entry যোগ করুন।

---

## 📞 সাহায্য দরকার?

যেকোনো সমস্যায় GitHub Issues খুলুন।
