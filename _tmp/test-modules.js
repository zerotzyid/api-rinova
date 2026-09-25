const episodeHelper = require('../helpers/episodeHelper');
const embedUnpack = require('../helpers/embed-unpack');

console.log('episodeHelper.get:', typeof episodeHelper.get);
console.log('episodeHelper.resolveMirror:', typeof episodeHelper.resolveMirror);
console.log('embedUnpack.extractMp4:', typeof embedUnpack.extractMp4);
console.log('embedUnpack.fetchEmbedMp4:', typeof embedUnpack.fetchEmbedMp4);
console.log('embedUnpack.isAllowed:', typeof embedUnpack.isAllowed);
console.log('embedUnpack.MP4_RE:', embedUnpack.MP4_RE);
console.log('embedUnpack.M3U8_RE:', embedUnpack.M3U8_RE);

// Test isAllowed
console.log('isAllowed odvidhide:', embedUnpack.isAllowed('https://odvidhide.com/embed/test'));
console.log('isAllowed filedon:', embedUnpack.isAllowed('https://filedon.co/embed/test'));
console.log('isAllowed vidhide:', embedUnpack.isAllowed('https://vidhide.com/embed/test'));
console.log('isAllowed mega:', embedUnpack.isAllowed('https://mega.nz/file/test'));
console.log('isAllowed other:', embedUnpack.isAllowed('https://other.com/embed/test'));

// Test extractMp4 with sample
const sample = 'file: "https://example.com/video.mp4"';
const extracted = embedUnpack.extractMp4(sample);
console.log('extractMp4 test:', extracted);

// Test extractMp4 with packed content
const packedHtml = 'eval(function(p,a,c,k,e,d){while(c--)if(k[c])p=p.replace(new RegExp("\\\\b"+c.toString(a)+"\\\\b","g"),k[c]);return p}(\'0 1\',2,2,\'test|hello\'))';
const extracted2 = embedUnpack.extractMp4(packedHtml);
console.log('extractMp4 with packed (should not crash):', extracted2);