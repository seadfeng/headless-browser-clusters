const { chromium } = require('playwright');
const Redis = require('ioredis');
const os = require('os');

// Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL);

// Redis key constants
const BROWSER_QUEUE = 'browser_queue';
const BROWSER_STATUS = 'browser_status';

// Get hostname, use environment variable or system hostname
const hostname = process.env.HOST_NAME ?? os.hostname();

/**
 * Clean up browser-related resources in Redis
 * @param {string} browserId - Unique identifier for the browser
 */
async function cleanupBrowser(browserId) {
  console.log(`Cleaning up browser ${browserId}...`);
  try {
    // Remove all browser-related keys and entries from Redis
    await Promise.all([
      redis.del(`ws:${browserId}`),           // Remove WebSocket endpoint
      redis.lrem(BROWSER_QUEUE, 0, browserId), // Remove from browser queue
      redis.hdel(BROWSER_STATUS, browserId),   // Remove status entry
      redis.del(`heartbeat:${browserId}`)      // Remove heartbeat key
    ]);
    console.log(`Browser ${browserId} cleaned up successfully`);
  } catch (error) {
    console.error(`Cleanup failed for ${browserId}:`, error);
  }
}

/**
 * Start a Playwright browser worker
 * @returns {Object} Browser instance and related information
 */
async function startWorker() {
  // Launch Chromium browser server with specific configuration
  const browser = await chromium.launchServer({
    args: [
      '--no-sandbox',               // Disable sandbox for container environments
      '--disable-setuid-sandbox',   // Disable setuid sandbox
      '--disable-dev-shm-usage',    // Overcome limited shared memory in containers
      '--disable-gpu',              // Disable GPU hardware acceleration
      // '--hide-scrollbars',          // Hide scrollbars
    ],
    headless: false,                // Run in headless mode
    handleSIGINT: false,            // Manually handle process signals
    handleSIGTERM: false,
    handleSIGHUP: false,
    host: "0.0.0.0",                // Bind to all network interfaces
    port: 8080                      // Specific port for WebSocket
  });

  // Get WebSocket endpoint
  const wsEndpoint = browser.wsEndpoint();

  // Replace localhost with host name for external access
  const containerWsEndpoint = wsEndpoint.replace('0.0.0.0', process.env.HOST_NAME);

  // Generate unique browser ID
  const browserId = `browser_${hostname}`;
  console.log(`Browser ${browserId} started with endpoint ${containerWsEndpoint}`);

  // Initialize browser metadata in Redis
  await Promise.all([
    redis.set(`ws:${browserId}`, containerWsEndpoint),  // Store WebSocket endpoint
    redis.rpush(BROWSER_QUEUE, browserId),              // Add to browser queue
    redis.hset(BROWSER_STATUS, browserId, 'idle'),      // Set initial status
    redis.set(`heartbeat:${browserId}`, Date.now())     // Set initial heartbeat
  ]);

  // Periodic heartbeat to indicate browser is alive
  const heartbeatInterval = setInterval(async () => {
    await redis.set(`heartbeat:${browserId}`, Date.now());
  }, 5000);

  // Cleanup function for graceful shutdown
  const cleanup = async () => {
    clearInterval(heartbeatInterval);  // Stop heartbeat interval
    await cleanupBrowser(browserId);   // Clean up Redis resources
    process.exit(0);                   // Exit process
  };

  // Register signal handlers for graceful shutdown
  process.on('SIGTERM', cleanup);  // Termination signal
  process.on('SIGINT', cleanup);   // Interrupt signal (Ctrl+C)
  process.on('SIGQUIT', cleanup);  // Quit signal

  return { browser, browserId, wsEndpoint };
}

// Start the worker with error handling
startWorker().catch(async error => {
  console.error('Worker failed:', error);

  // Attempt to clean up even if worker start fails
  const browserId = `browser_${hostname}`;
  await cleanupBrowser(browserId);

  process.exit(1);  // Exit with error status
});
