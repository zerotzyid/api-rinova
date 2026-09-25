const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://otakuproxy.zerowebsite.eu.org/';
const full = 'episode/tstjwgcm-episode-13-sub-indo';
const url = BASE_URL + full.replace(/^\/+/, '');

async function test() {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: BASE_URL,
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 20000,
      validateStatus: (s) => s === 200,
    });
    const html = typeof res.data === 'string' ? res.data : '';
    console.log('Length:', html.length);
    const $ = cheerio.load(html);
    const title1 = $(".venutama > h1").first().text();
    console.log('title:', title1);
  } catch (e) {
    console.error('Error:', e.message, e.response?.status);
  }
}
test();