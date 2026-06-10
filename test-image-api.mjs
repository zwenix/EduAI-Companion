import https from 'https';

const url = 'https://image.pollinations.ai/prompt/cat?width=800&height=600&nologo=true&model=flux&seed=123';

https.get(url, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);
  if (res.statusCode >= 300 && res.statusCode < 400) {
    console.log('Redirect location:', res.headers.location);
  }
}).on('error', (err) => {
  console.error('Error:', err);
});
