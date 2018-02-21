import puppeteer from 'puppeteer'
import DataLoader from 'dataloader'
import logger from './logger'

export default puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
}).then(browser => new DataLoader(async urls => urls.map(async url => {
    const browserProfiler = logger.startTimer();
    const page = await browser.newPage()
    browserProfiler.done('Initialized new browser page');

    const pageProfiler = logger.startTimer();
    await page.goto(url, { waitUntil: 'networkidle2' })
    pageProfiler.done('Loaded url: ' + url)
    return page
  }))
)
