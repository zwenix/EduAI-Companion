export default async function handler(req: any, res: any) {
  try {
    const serverModule = await import('../server');
    const app = serverModule.default;
    return app(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Function Crash:", error);
    res.status(500).json({
      error: "Vercel serverless function crash",
      message: error.message || String(error),
      stack: error.stack || ""
    });
  }
}
