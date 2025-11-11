import app from "./app";
import config from "./app/config/index";
import connectDB from "./app/config/database";
import seedSuperAdmin from "./app/config/seedSuperAdmin";

const port = config.port || 5000;

// Initialize database connection for serverless
let isConnected = false;

async function initializeDatabase() {
  if (!isConnected) {
    try {
      await connectDB();
      await seedSuperAdmin();
      isConnected = true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to connect to database:", error);
    }
  }
}

// Connect to database and start server
async function startServer() {
  try {
    await initializeDatabase();

    // Start the Express server
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// For local development
if (process.env.NODE_ENV !== "production") {
  startServer();
}

// For Vercel serverless - initialize DB on cold start
initializeDatabase();

// Export the Express app for Vercel
export default app;
