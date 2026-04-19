let isLoaded = false

export function useBotpress() {
  const loadBotpress = () => {
    if (isLoaded) return

    // inject script 1
    const script1 = document.createElement('script')
    script1.src = 'https://cdn.botpress.cloud/webchat/v3.6/inject.js'
    script1.async = true

    // inject script 2 (config bot của bạn)
    const script2 = document.createElement('script')
    script2.src = 'https://files.bpcontent.cloud/2026/04/04/10/20260404104002-RYVUKOXY.js'
    script2.defer = true

    document.body.appendChild(script1)
    document.body.appendChild(script2)

    isLoaded = true
  }

  return { loadBotpress }
}