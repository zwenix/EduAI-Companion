import axios from 'axios';

async function run() {
  try {
    const res = await axios.get("http://localhost:3000/api/admin/debug-errors");
    console.log("Failed Request Logs count:", res.data?.errors?.length);
    console.dir(res.data, { depth: null });
  } catch (err: any) {
    console.error("Failed to query debug errors:", err.message);
  }
}

run();
