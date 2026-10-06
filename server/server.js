const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 My Pocket API Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('Received kill signal, shutting down gracefully...');
      server.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`💥 Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
