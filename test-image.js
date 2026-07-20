import fetch from 'node-fetch';

async function run() {
  const url = `https://image.pollinations.ai/prompt/cat?width=1024&height=1024&nologo=true`;
  const res = await fetch(url);
  console.log(res.status);
  const buf = await res.arrayBuffer();
  console.log(buf.byteLength);
}
run();
