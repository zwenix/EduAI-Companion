import axios from 'axios';
import fs from 'fs';

async function run() {
  const url = 'https://claude.ai/share/e8c9346a-44d9-447a-80c4-7475997ca3f0';
  console.log('Fetching Claude share page:', url);
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/437.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/437.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    console.log('Received HTML size:', html.length);
    fs.writeFileSync('claude_share_raw.html', html);

    // Let's look for __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      console.log('Found __NEXT_DATA__ block!');
      const nextDataJson = JSON.parse(nextDataMatch[1]);
      fs.writeFileSync('claude_next_data.json', JSON.stringify(nextDataJson, null, 2));
      console.log('Saved to claude_next_data.json');
      
      // Attempt to extract share model or content
      // Let's traverse Next.js props: props -> pageProps -> sharedConversation/messages etc.
      const props = nextDataJson.props || {};
      console.log('Props keys:', Object.keys(props));
      if (props.pageProps) {
        console.log('PageProps keys:', Object.keys(props.pageProps));
        fs.writeFileSync('claude_page_props.json', JSON.stringify(props.pageProps, null, 2));
      }
    } else {
      console.log('__NEXT_DATA__ block not found.');
      // Fallback: search for other script tags or save any JSON blocks
      const jsonLikeMatches = html.match(/\{"sharedConversation":[\s\S]*?\}/g);
      if (jsonLikeMatches) {
        console.log(`Found ${jsonLikeMatches.length} matches for sharedConversation JSON pattern.`);
        fs.writeFileSync('claude_conversation.json', jsonLikeMatches[0]);
      }
    }

    // Also strip HTML tags for general readability
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    fs.writeFileSync('claude_text.txt', text);
    console.log('Written stripped text to claude_text.txt. Preview:', text.substring(0, 500));

  } catch (err) {
    console.error('Error fetching/parsing:', err.message);
  }
}

run();
