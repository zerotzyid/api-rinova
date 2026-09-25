const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }
  return browserPromise;
}

async function resolveWithPuppeteer(url, referer) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    if (referer) {
      await page.setExtraHTTPHeaders({ 'Referer': referer });
    }
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for video element
    await page.waitForSelector('video', { timeout: 15000 });

    const videoSrc = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? (video.currentSrc || video.src) : null;
    });

    return videoSrc;
  } finally {
    await page.close();
  }
}

module.exports = { resolveWithPuppeteer };