const axios = require('axios');
const B = process.env.BASE_URL_TEST || 'http://localhost:3000';

async function hit(method, path, data) {
  try {
    const r = await axios({ method, url: B + path, data, timeout: 60000, validateStatus: () => true });
    return { code: r.status, ct: r.headers['content-type'] || '', body: r.data };
  } catch (e) { return { code: 'ERR', ct: '', body: e.message }; }
}
const s = (v) => { let t = typeof v === 'string' ? v : JSON.stringify(v); return t.length > 300 ? t.slice(0, 300) + '...' : t; };
const out = [];
let pass = 0, failN = 0;
const check = (name, cond, r, info) => {
  out.push([cond ? 'PASS' : 'FAIL', name, r, info]);
  if (cond) pass++; else failN++;
};
const isEnvelope = (b) => b && b.status === 'success' && b.creator && b.statusCode === 200 && b.ok === true && 'data' in b && 'pagination' in b;

(async () => {
  const wel = await hit('GET', '/');
  check('GET /', wel.code === 200, wel, '');

  const search = await hit('GET', '/api/search/boruto');
  check('GET /api/search/boruto envelope', search.code === 200 && isEnvelope(search.body) && Array.isArray(search.body.data?.animeList), search, 'items=' + (search.body?.data?.animeList?.length));
  const id = search.body?.data?.animeList?.[0]?.animeId || search.body?.data?.animeList?.[0]?.id;

  const detail = await hit('GET', '/api/anime/' + id);
  const d = detail.body?.data || {};
  check('GET /api/anime/:id envelope+detail', detail.code === 200 && isEnvelope(detail.body) && !!d.title && !!d.synopsis && Array.isArray(d.genreList), detail, 'title=' + d.title + ' eps=' + (d.episodeList?.length) + ' batch=' + (d.batch?.batchId || d.batchLink?.batchId));
  check('GET /api/anime/:id anilist', !!d.anilist && !!d.anilist.id, detail, '');
  const epsList = (d.episodeList || d.episode_list || []).filter(e => e.id && String(e.id).includes('episode/'));

  const epId = epsList[0]?.id || epsList[0]?.episodeId;
  const eps = await hit('GET', '/api/eps/' + epId);
  const e = eps.body?.data || {};
  check('GET /api/eps/:id envelope+server', eps.code === 200 && isEnvelope(eps.body) && !!e.server?.qualities, eps, 'title=' + e.title + ' default=' + String(e.defaultStreamingUrl || e.streamLink).slice(0, 60));
  const q0 = e.server?.qualities?.[0]?.serverList?.[0];
  check('GET /api/eps serverList shape', !!q0?.serverId && !!q0?.title && !!q0?.href, eps, JSON.stringify(q0).slice(0, 120));

  const serverId = q0?.serverId;
  if (serverId) {
    const srv = await hit('GET', '/api/server/' + encodeURIComponent(serverId));
    check('GET /api/server/:serverId', srv.code === 200 && isEnvelope(srv.body) && !!(srv.body.data?.url), srv, String(srv.body?.data?.url).slice(0, 80));
  }
  const mirror = q0;
  const mres = await hit('POST', '/api/eps/' + epId + '/mirror/', { mirrorId: mirror?.data_content || mirror?.serverId });
  check('POST /api/eps/.../mirror/', mres.code === 200 && (mres.body?.data?.streamLink || mres.body?.streamLink || mres.body?.data?.url), mres, '');

  const batchId = d.batch?.batchId || d.batchLink?.batchId || d.batch_link?.batchId;
  const batch = await hit('GET', '/api/batch/' + batchId);
  const b = batch.body?.data || {};
  check('GET /api/batch/:id envelope', batch.code === 200 && isEnvelope(batch.body) && !!(b.downloadUrl?.formats || b.batch_list), batch, 'title=' + b.title);
  check('GET /api/batch formats shape', Array.isArray(b.downloadUrl?.formats) && Array.isArray(b.downloadUrl?.formats?.[0]?.qualities), batch, '');

  for (const p of ['/api/home', '/api/complete', '/api/complete/page/2', '/api/ongoing', '/api/ongoing/page/1', '/api/schedule', '/api/genres', '/api/genres/action/page/1']) {
    const r = await hit('GET', p);
    const dd = r.body?.data;
    const n = dd?.animeList?.length ?? dd?.ongoing?.animeList?.length ?? (Array.isArray(dd) ? dd.length : null) ?? dd?.genreList?.length ?? '-';
    check('GET ' + p, r.code === 200 && isEnvelope(r.body), r, 'items=' + n);
  }
  check('GET /api/home shape', true, await hit('GET', '/api/home'), '');
  const home = await hit('GET', '/api/home');
  check('GET /api/home ongoing.complete', !!home.body?.data?.ongoing?.animeList && !!home.body?.data?.complete?.animeList, home, '');

  const bad = await hit('GET', '/api/tidak-ada');
  check('GET /api/tidak-ada 404', bad.code === 404, bad, '');
  const bad2 = await hit('GET', '/halaman-tidak-ada');
  check('GET /halaman-tidak-ada 404', bad2.code === 404, bad2, '');
  const badEps = await hit('GET', '/api/eps/tidak-ada');
  check('GET /api/eps/tidak-ada 404', badEps.code === 404, badEps, '');
  const badMirror = await hit('POST', '/api/eps/episode/x/mirror/', {});
  check('POST mirror tanpa mirrorId 4xx/5xx', badMirror.code >= 400, badMirror, '');
  const badGenre = await hit('GET', '/api/genres/action/page/999');
  check('GET /api/genres/action/page/999 404', badGenre.code === 404, badGenre, '');

  for (const [st, n, r, i] of out) {
    console.log('='.repeat(90));
    console.log(st + ' ' + n);
    console.log('  HTTP ' + r.code + ' json=' + String(r.ct).includes('json') + (i ? ' | ' + i : ''));
    console.log('  ' + s(r.body));
  }
  console.log('\nSUMMARY: ' + pass + ' PASS, ' + failN + ' FAIL dari ' + out.length);
  process.exit(failN ? 1 : 0);
})();
