import axios from 'axios';
const test = async (model) => {
  try {
    const res = await axios.post('https://api-inference.huggingface.co/models/' + model, { inputs: 'test' }, { headers: { Authorization: "Bearer " + (process.env.HF_TOKEN || "") } });
    console.log(model, 'success', res.status);
  } catch (e) {
    console.log(model, 'error', e.response ? e.response.status : e.message);
  }
};
test('stabilityai/stable-diffusion-xl-base-1.0');
test('runwayml/stable-diffusion-v1-5');
test('stabilityai/stable-diffusion-2-1');
test('black-forest-labs/FLUX.1-schnell');
test('black-forest-labs/FLUX.1-dev');
