const run = async () => {
    try {
        const res = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({inputs: "astronaut on a horse"})
        })
        console.log(res.status);
        const text = await res.text();
        console.log(text.substring(0, 100));
    } catch(err) {
        console.log("error", err);
    }
}
run();
