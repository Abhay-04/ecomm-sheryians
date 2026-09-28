import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import app from './app.js';

try {
  await connectDatabase(env.mongoUri);

  app.listen(env.port, () => {
    console.log(`API running on port ${env.port} (${env.nodeEnv})`);
  });
} catch (error) {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}
