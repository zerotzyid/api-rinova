const { fetchHtml } = require('../helpers/upstream');
(async () => {
  try {
    const res = await fetchHtml('episode/ynko-episode-2-sub-indo/');
    console.log('Success, length:', res.html.length);
    console.log('Preview:', res.html.substring(0,300));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();