import { searchYouTube } from '../services/youtubeService.js';

async function test() {
  const r = await searchYouTube('Kesariya Arijit Singh', 3);
  console.log('Result count:', r.length);
  if (r.length > 0) {
    console.log('First track:', r[0]);
  }
}
test();

