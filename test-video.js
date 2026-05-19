import https from 'https';

const getHeaders = (url) => new Promise((resolve) => {
  https.get(url, (res) => resolve(res.headers['content-type']));
});

async function main() {
  const type = await getHeaders('https://image.pollinations.ai/prompt/cat?model=ltx-video&video=true');
  console.log('Type:', type);
}
main();
