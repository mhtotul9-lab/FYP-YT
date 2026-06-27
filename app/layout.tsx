import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'বাংলা থাম্বনেইল জেনারেটর | Bangla Thumbnail Generator',
  description: 'YouTube thumbnail তৈরি করুন বাংলায় - AI powered professional thumbnail generator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  )
}
