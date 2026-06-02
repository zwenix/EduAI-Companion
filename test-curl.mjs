import https from 'https';

https.get('https://image.pollinations.ai/prompt/cat?model=ltx-video', (res) => {
  console.log(res.headers['content-type']);
});
