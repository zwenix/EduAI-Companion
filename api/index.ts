import server from "../dist/server.cjs";

const app = (server as any).default || server;

export default app;


