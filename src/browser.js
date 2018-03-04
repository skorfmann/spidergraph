import puppeteer from 'puppeteer'
import DataLoader from 'dataloader'
import { URL } from "url"
import fse from "fs-extra"
import path from "path"
import logger from './logger'
import { AdBlockClient, FilterOptions, adBlockLists } from "ad-block";
import { makeAdBlockClientFromDATFile } from "ad-block/lib/util";

export default puppeteer
  .launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--proxy-server=127.0.0.1:8000"
    ],
    // executablePath: "/usr/bin/chromium-browser",
    ignoreHTTPSErrors: true
  })
  .then(async browser => {
    const client = await makeAdBlockClientFromDATFile(
      process.env.PWD + "/ABPFilterParserData.dat"
    );

    return new DataLoader(async urls =>
      urls.map(async url => {
        const browserProfiler = logger.startTimer();
        const page = await browser.newPage();
        browserProfiler.done("Initialized new browser page");

        let count = 0;
        await page.setRequestInterception(true);

        page.on("request", request => {
          const resourceType = request.resourceType();
          const isAdRequest = client.matches(
            request.url(),
            resourceType === "xhr" ? "xmlHttpRequest" : resourceType,
            "immobilienscout24.de"
          );
          if (isAdRequest === true) {
            count += 1;
            console.log("blocked ", count, " - ", request.url());
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
  });
