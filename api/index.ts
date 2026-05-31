let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      // Dynamic import to handle load-time errors gracefully
      const serverModule = await import("../server");
      appInstance = serverModule.default || serverModule;
    }
    return appInstance(req, res);
  } catch (error: any) {
    console.error("Vercel Serverless Init/Runtime Error:", error);
    return res.status(500).json({
      error: {
        message: "Serverless function initialization failed.",
        code: "SERVERLESS_INIT_ERROR",
        details: error.message || error.toString(),
        stack: error.stack || ""
      }
    });
  }
}

