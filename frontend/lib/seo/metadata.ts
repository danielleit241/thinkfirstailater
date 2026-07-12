import type { Metadata } from "next"

import { getSiteUrl, SITE } from "@/lib/seo/site"

type PageMetadataInput = {
  title: string
  description?: string
  path: string
  noindex?: boolean
}

export function buildPageMetadata({
  title,
  description = SITE.defaultDescription,
  path,
  noindex = false,
}: PageMetadataInput): Metadata {
  const pathname = path.startsWith("/") ? path : `/${path}`
  const canonicalUrl = new URL(pathname, getSiteUrl()).toString()
  const socialTitle = title.includes(SITE.name)
    ? title
    : `${title} | ${SITE.name}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url: canonicalUrl,
      siteName: SITE.name,
      title: socialTitle,
      description,
      images: [
        {
          url: "/background.png",
          width: 715,
          height: 515,
          alt: "Hành trình từ tư duy độc lập đến cộng tác với AI",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["/background.png"],
    },
  }
}
