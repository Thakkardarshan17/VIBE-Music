import axios from 'axios';

async function testParse() {
  const query = 'Arijit Singh Latest 2026';
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const resp = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 8000,
  });

  const html = resp.data;
  const match = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/s);
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
      const videos = [];
      for (const item of contents) {
        const v = item.videoRenderer;
        if (v && v.videoId) {
          const title = v.title?.runs?.map((r: any) => r.text).join('') || '';
          const artist = v.ownerText?.runs?.[0]?.text || 'Official Artist';
          const durationStr = v.lengthText?.simpleText || '3:30';
          const parts = durationStr.split(':').map((p: string) => parseInt(p, 10));
          const duration = parts.length === 2 ? parts[0] * 60 + parts[1] : 210;
          const thumbnail = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
          videos.push({ videoId: v.videoId, title, artist, duration, thumbnail });
        }
      }
      console.log('Parsed videos count:', videos.length);
      console.log('First 2:', JSON.stringify(videos.slice(0, 2), null, 2));
    } catch (e: any) {
      console.error('JSON parse error:', e.message);
    }
  } else {
    console.log('No ytInitialData match');
  }
}
testParse();

