import https from 'https';
const req = https.get('https://image.pollinations.ai/prompt/a%20cat%20walking?nologo=true&model=ltx-video', (res) => {
  console.log(res.statusCode, res.headers['content-type']);
});
