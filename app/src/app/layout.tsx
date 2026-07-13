import type { Metadata } from "next"
import { Be_Vietnam_Pro, Space_Grotesk } from "next/font/google"

import { buildPageMetadata } from "@/lib/seo/metadata"
import { RootJsonLd } from "@/lib/seo/root-json-ld"
import { getSiteUrl, SITE } from "@/lib/seo/site"

import "./globals.css"

const bodyFont = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
})

const utilityFont = Space_Grotesk({
  variable: "--font-utility",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...buildPageMetadata({
    title: SITE.name,
    description: SITE.defaultDescription,
    path: "/",
  }),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.shortName}`,
  },
  applicationName: SITE.name,
  keywords: [
    "tư duy phản biện",
    "giáo dục AI",
    "kỹ năng sử dụng AI",
    "học tập chủ động",
    "Think First AI Later",
  ],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${bodyFont.variable} ${utilityFont.variable}`}>
        {children}
        <RootJsonLd />
      </body>
    </html>
  )
}
