import axios from 'axios';
axios.post('https://api-inference.huggingface.co/models/prompthero/openjourney', { inputs: 'test' })
  .then(() => console.log('success'))
  .catch(e => console.log('Error data:', e.response ? e.response.status + ' ' + (typeof e.response.data === 'string' ? e.response.data.substring(0,100) : JSON.stringify(e.response.data)) : e.message));
