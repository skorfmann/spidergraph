import puppeteer from 'puppeteer'
import DataLoader from 'dataloader'
import { URL } from "url"
import fse from "fs-extra"
import path from "path"
import logger from './logger'
import { AdBlockClient, FilterOptions, adBlockLists } from "ad-block";
import { makeAdBlockClientFromDATFile } from "ad-block/lib/util";

class Browser {
  constructor() {
    this.browser = undefined
    this.client = undefined
  }

  async init() {
    if (this.browser !== undefined) return

    this.browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ],
      // executablePath: "/usr/bin/chromium-browser",
      ignoreHTTPSErrors: true
    })

    this.client = await makeAdBlockClientFromDATFile(
      process.env.PWD + "/ABPFilterParserData.dat"
    );
  }

  async close() {
    if (this.browser !== undefined) {
      try { await this.browser.close(); } catch (err) { console.log(err); }
    }
  }

  loader() {
    if (this.dataLoader !== undefined) return this.dataLoader

    this.dataLoader = new DataLoader(async urls =>
      urls.map(async url => {
        const browserProfiler = logger.startTimer();
        const page = await this.browser.newPage();
        browserProfiler.done("Initialized new browser page");
        await page.setRequestInterception(true);

        page.on("request", request => {
          const resourceType = request.resourceType();
          const isAdRequest = this.client.matches(
            request.url(),
            resourceType === "xhr" ? "xmlHttpRequest" : resourceType,
            "immobilienscout24.de"
          );
          if (isAdRequest === true) {
            request.abort();
          } else {
            request.continue();
          }
        });

        const pageProfiler = logger.startTimer();
        await page.goto(url, { waitUntil: "networkidle2" });
        pageProfiler.done("Loaded url: " + url);
        return page;
      })
    );

    return this.dataLoader
  }
}

export default Browser
