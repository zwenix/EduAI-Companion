import axios from 'axios';
const test = async () => {
    try {
        const res = await axios.post('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', { inputs: "an astronaut" });
        console.log("Success", res.status);
    } catch(err) {
        console.log("error", err.response ? `${err.response.status} ${typeof err.response.data === 'string' ? err.response.data.substring(0,200) : JSON.stringify(err.response.data)}` : err.message);
    }
}
test();
