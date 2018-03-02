import puppeteer from 'puppeteer'
import DataLoader from 'dataloader'
import { URL } from "url"
import fse from "fs-extra"
import path from "path"
import logger from './logger'

export default puppeteer
  .launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--proxy-server=127.0.0.1:8000"
    ]
  })
  .then(
    browser =>
      new DataLoader(async urls =>
        urls.map(async url => {
          const browserProfiler = logger.startTimer();
          const page = await browser.newPage();
          browserProfiler.done("Initialized new browser page");

          const pageProfiler = logger.startTimer();
          await page.goto(url, { waitUntil: "networkidle2" });
          pageProfiler.done("Loaded url: " + url);
          return page;
        })
      )
  );
