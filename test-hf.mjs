import axios from 'axios';
axios.post('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', { inputs: 'test' })
  .then(() => console.log('success'))
  .catch(e => console.log('Error data:', e.response ? e.response.status + ' ' + (typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)) : e.message));
