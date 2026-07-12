import { getSiteUrlFromRequest } from "@/lib/seo/request-site-url"
import { SITE } from "@/lib/seo/site"

export async function RootJsonLd() {
  const siteUrl = await getSiteUrlFromRequest()
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}/#organization`,
        name: SITE.name,
        url: siteUrl,
        logo: `${siteUrl}/icon.png`,
        description: SITE.defaultDescription,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: SITE.name,
        description: SITE.defaultDescription,
        inLanguage: SITE.language,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  )
}
