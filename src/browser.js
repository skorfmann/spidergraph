import puppeteer from 'puppeteer'
import DataLoader from 'dataloader'

export default puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
}).then(browser => new DataLoader(async urls => urls.map(async url => {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })
    return page
  }))
)
