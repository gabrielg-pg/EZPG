import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"

const OG_THUMB = "https://vumbnail.com/1214853650.jpg"

export const metadata: Metadata = {
  title: "Pro Growth — Quem somos em 5 minutos",
  description: "5 minutos. Sem pitch. Só o que você precisa saber antes de decidir.",
  robots: { index: false, follow: false },
  icons: {
    icon: "https://progrowthglobal.com.br/wp-content/uploads/2026/01/cropped-Favicon-PG-270x270.png",
    apple: "https://progrowthglobal.com.br/wp-content/uploads/2026/01/cropped-Favicon-PG-270x270.png",
  },
  openGraph: {
    title: "Pro Growth — Quem somos em 5 minutos",
    description: "5 minutos. Sem pitch. Só o que você precisa saber antes de decidir.",
    type: "website",
    locale: "pt_BR",
    images: [{ url: OG_THUMB, width: 1280, height: 720, alt: "Pro Growth Global" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pro Growth — Quem somos em 5 minutos",
    description: "5 minutos. Sem pitch. Só o que você precisa saber antes de decidir.",
    images: [OG_THUMB],
  },
}

const META_PIXEL_ID = "1072489904995751"

export default function QuemSomosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Preconnect aos domínios do Vimeo para o vídeo carregar rápido, sem delay perceptível */}
      <link rel="preconnect" href="https://player.vimeo.com" crossOrigin="" />
      <link rel="preconnect" href="https://i.vimeocdn.com" crossOrigin="" />
      <link rel="preconnect" href="https://f.vimeocdn.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://player.vimeo.com" />
      {/* SDK do Vimeo — afterInteractive é o correto em layout aninhado do App Router.
          O vídeo em si dá autoplay pelo próprio iframe; o SDK só controla som e tempo. */}
      <Script src="https://player.vimeo.com/api/player.js" strategy="afterInteractive" />

      {/* Meta Pixel Code */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {/* End Meta Pixel Code */}

      {children}
    </>
  )
}
