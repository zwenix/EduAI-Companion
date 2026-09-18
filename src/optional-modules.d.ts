// Optional server-only exporters are loaded dynamically so the browser bundle
// does not carry their large dependencies. Keep the compiler aware of those
// modules when a deployment chooses to install them.
declare module 'docx';
declare module 'puppeteer';
