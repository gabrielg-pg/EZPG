import Script from "next/script"

const META_PIXEL_ID = "1072489904995751"
const GA_MEASUREMENT_ID = "G-29G4G99E68"

/**
 * Scripts de rastreamento (Google Analytics 4 + Meta Pixel) usados nas páginas
 * públicas dos funis de conversão (/quiz, /qualificacao e /quem-somos).
 *
 * Além de inicializar o GA4 e o Pixel, registra funções globais de evento em
 * `window` (trackFunnelEntry, trackQuizAnswer, trackQuizResult, trackVideoStart,
 * trackVideoComplete, trackWhatsAppClick e as variantes Meta). Use o helper
 * tipado em `lib/tracking.ts` para chamá-las a partir dos componentes.
 */
export function TrackingScripts() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        id="ga-gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="ga-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            'allow_google_signals': true,
            'allow_ad_personalization_signals': true
          });

          // ===== Funções de rastreamento (Google Analytics) =====
          window.trackFunnelEntry = function(funnelName, funnelNumber) {
            gtag('event', 'funnel_entry', {
              'event_category': 'pro_growth_funnel',
              'event_label': funnelName,
              'funnel_number': funnelNumber,
              'timestamp': new Date().toISOString()
            });
          };

          window.trackQuizAnswer = function(funnelName, questionNumber, answer) {
            gtag('event', 'quiz_answer', {
              'event_category': 'pro_growth_funnel',
              'event_label': funnelName + ' - Pergunta ' + questionNumber,
              'answer': answer,
              'timestamp': new Date().toISOString()
            });
          };

          window.trackQuizResult = function(funnelName, score, passed) {
            gtag('event', 'quiz_completed', {
              'event_category': 'pro_growth_funnel',
              'event_label': funnelName,
              'value': score,
              'passed': passed,
              'timestamp': new Date().toISOString()
            });
          };

          window.trackVideoStart = function() {
            gtag('event', 'video_start', {
              'event_category': 'pro_growth_funnel',
              'event_label': 'VSL - Quem Somos'
            });
          };

          window.trackVideoComplete = function() {
            gtag('event', 'video_complete', {
              'event_category': 'pro_growth_funnel',
              'event_label': 'VSL - Quem Somos'
            });
          };

          window.trackWhatsAppClick = function(funnelName, funnelNumber) {
            gtag('event', 'conversion_complete', {
              'event_category': 'pro_growth_conversion',
              'event_label': funnelName + ' - WhatsApp Click',
              'funnel_number': funnelNumber,
              'conversion': true,
              'value': 1
            });
          };
        `}
      </Script>

      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');

          // ===== Funções de rastreamento (Meta Pixel) =====
          window.trackMetaFunnelEntry = function(funnelName) {
            fbq('track', 'ViewContent', {
              content_name: 'Entrada Funil: ' + funnelName,
              content_category: 'funnel_entry',
              currency: 'BRL'
            });
          };

          window.trackMetaQuizComplete = function(funnelName, passed) {
            fbq('track', 'Lead', {
              content_name: funnelName + (passed ? ' - Aprovado' : ' - Reprovado'),
              content_category: 'quiz_complete',
              currency: 'BRL'
            });
          };

          window.trackMetaWhatsApp = function(funnelName) {
            fbq('track', 'Lead', {
              content_name: funnelName + ' - WhatsApp Click',
              content_category: 'conversion',
              value: 1,
              currency: 'BRL'
            });
          };
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
