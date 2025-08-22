// 팝업 스크립트

document.addEventListener('DOMContentLoaded', () => {
  const openWebsiteBtn = document.getElementById('openWebsite')
  const viewGuideBtn = document.getElementById('viewGuide')
  const privacyLink = document.getElementById('privacy')
  const feedbackLink = document.getElementById('feedback')

  openWebsiteBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://parking-helper.vercel.app' })
  })

  viewGuideBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://parking-helper.vercel.app/guide' })
  })

  privacyLink?.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: 'https://parking-helper.vercel.app/privacy' })
  })

  feedbackLink?.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: 'https://parking-helper.vercel.app/feedback' })
  })
})