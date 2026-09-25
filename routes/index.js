const express = require('express')
const router  = express.Router()
const MainController = require('../controllers/main.controller')
const AnimeController = require('../controllers/anime.controller')
const BloggerController = require('../controllers/blogger.controller')

router.get('/home', MainController.home)
router.get('/complete',MainController.completeAnimeList)
router.get('/complete/page/:page',MainController.completeAnimeList)
router.get('/ongoing',MainController.onGoingAnimeList)
router.get('/ongoing/page/:page',MainController.onGoingAnimeList)
router.get('/schedule',MainController.schedule)
router.get('/genres',MainController.genre)
router.get('/genres/:id/page/:pageNumber',MainController.animeByGenre)
router.get('/search/:query',MainController.search)
router.get('/anime/:id',AnimeController.detailAnime)
router.get('/batch/:id',AnimeController.batchAnime)
router.get('/eps/*',AnimeController.epsAnime)
router.get('/auto-server/*',AnimeController.autoServer)
router.get('/server/:serverId',AnimeController.serverStream)
router.post('/eps/*',AnimeController.epsMirror)

router.get('/bv/check', BloggerController.checkToken)
router.get('/bv/direct', BloggerController.direct)
router.get('/bv/frame', BloggerController.frame)
router.get('/bv/test-player', BloggerController.testPlayer)
router.get('/bv/*', BloggerController.asset)
router.post('/bv/*', BloggerController.asset)

router.get('/youtube-extract', require('../api/youtube-extract'))
router.get('/extract', require('../api/unified-extract'))

router.get('/debug-proxy', async (req, res) => {
  try {
    const Axios = require('axios')
    const r = await Axios.get('https://proxy.goibsmp.eu.org/__debug_ip', { timeout: 10000 })
    res.json(r.data)
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

router.get('/debug-upstream', async (req, res) => {
  try {
    const Axios = require('axios')
    const PROXY_KEY = 'f141061f471140e6ab5ff92ca76bd822ce2463cd4f384f3eb9f7b123c1b684d4';
    const r = await Axios.get('https://proxy.goibsmp.eu.org/episode/ynko-episode-2-sub-indo/', {
      timeout: 20000,
      validateStatus: () => true,
      maxRedirects: 5,
      headers: {
        'X-Rinova-Proxy-Key': PROXY_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    })
    const html = typeof r.data === 'string' ? r.data : ''
    res.json({
      status: r.status,
      length: html.length,
      preview: html.slice(0, 200),
      upstreamStatusHeader: r.headers['x-upstream-status'] || null,
      rinovaAuthedHeader: r.headers['x-rinova-authed'] || null,
    })
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

module.exports = router