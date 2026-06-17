import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`SaaS App running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
