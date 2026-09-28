import mongoose from 'mongoose';

let connectionPromise = null;

// Connects once and reuses the connection afterwards. On Vercel the app runs as
// a serverless function that may start without server.js, so the first request
// opens the connection and later requests on the same instance reuse it.
export function connectDatabase(mongoUri) {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri)
      .then(() => {
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
      })
      .catch((error) => {
        // Allow the next request to try again instead of reusing a failed attempt.
        connectionPromise = null;
        throw error;
      });
  }
  return connectionPromise;
}
