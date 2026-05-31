import app from './dist/server.cjs';
console.log('Imported app type:', typeof app);
console.log('Is express app:', !!app && typeof app.use === 'function');
