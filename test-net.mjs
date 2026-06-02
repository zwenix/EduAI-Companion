import axios from 'axios';
axios.get('https://google.com')
  .then(() => console.log('success'))
  .catch(e => console.log('error'));
