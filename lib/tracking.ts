/**
 * Helpers de rastreamento client-side.
 *
 * As funções globais (window.trackXxx) são registradas por <TrackingScripts />
 * (GA4 + Meta Pixel). Estes wrappers são SSR-safe e viram no-op caso os scripts
 * ainda não tenham carregado, evitando erros em qualquer situação.
 */

type AnyFn = (...args: unknown[]) => void

function call(name: string, ...args: unknown[]) {
  if (typeof window === "undefined") return
  const fn = (window as unknown as Record<string, AnyFn | undefined>)[name]
  if (typeof fn === "function") {
    try {
      fn(...args)
    } catch {
      // Nunca deixa o rastreamento quebrar a experiência do usuário.
    }
  }
}

/** Entrada em um funil (dispara GA + Meta). */
export function trackFunnelEntry(funnelName: string, funnelNumber: number) {
  call("trackFunnelEntry", funnelName, funnelNumber)
  call("trackMetaFunnelEntry", funnelName)
}

/** Resposta de uma pergunta do quiz/qualificação. */
export function trackQuizAnswer(funnelName: string, questionNumber: number, answer: string) {
  call("trackQuizAnswer", funnelName, questionNumber, answer)
}

/** Conclusão do quiz/qualificação com pontuação e aprovação (dispara GA + Meta). */
export function trackQuizResult(funnelName: string, score: number, passed: boolean) {
  call("trackQuizResult", funnelName, score, passed)
  call("trackMetaQuizComplete", funnelName, passed)
}

/** Início da reprodução de um vídeo (VSL ou depoimento). */
export function trackVideoStart(videoTitle?: string, funnelName?: string) {
  call("trackVideoStart", videoTitle, funnelName)
}

/** Conclusão de um vídeo (VSL ou depoimento). */
export function trackVideoComplete(videoTitle?: string, funnelName?: string) {
  call("trackVideoComplete", videoTitle, funnelName)
}

/** Visualização de uma etapa/tela do funil (mapeia todas as telas, sem furos). */
export function trackFunnelStep(
  funnelName: string,
  funnelNumber: number,
  stepNumber: number,
  stepName: string,
) {
  call("trackFunnelStep", funnelName, funnelNumber, stepNumber, stepName)
}

/** Captura de lead via formulário — conversão (dispara GA generate_lead + Meta Lead). */
export function trackLeadCapture(funnelName: string, funnelNumber: number) {
  call("trackLeadCapture", funnelName, funnelNumber)
  call("trackMetaLeadCapture", funnelName)
}

/** Conclusão do funil, ex.: redirecionamento para a VSL. */
export function trackFunnelComplete(funnelName: string, funnelNumber: number) {
  call("trackFunnelComplete", funnelName, funnelNumber)
}

/** Clique no botão de WhatsApp — conversão (dispara GA + Meta). */
export function trackWhatsAppClick(funnelName: string, funnelNumber: number) {
  call("trackWhatsAppClick", funnelName, funnelNumber)
  call("trackMetaWhatsApp", funnelName)
}
