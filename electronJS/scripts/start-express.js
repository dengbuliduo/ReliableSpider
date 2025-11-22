// Dev helper to start ExpressService without Electron
const path = require('path');

async function startExpressStandalone() {
  try {
    const { CrawlerApplication } = require(path.join(__dirname, '../dist/electron/src/app/crawler.app.js'));
    const { ExpressService } = require(path.join(__dirname, '../dist/electron/src/services/express.service.js'));

    const app = new CrawlerApplication();
    const initialized = await app.initialize();
    if (!initialized) {
      console.error('CrawlerApplication failed to initialize. Check configuration and dependencies.');
      process.exit(1);
    }

    const services = app.getServices();
    const db = app.getDatabaseService();
    if (!db) {
      console.error('DatabaseService not available. Ensure mysql_config.json is configured and reachable.');
      process.exit(1);
    }

    const expressService = new ExpressService(db, services.taskService || undefined);
    await expressService.start();
    const address = expressService.getServerAddress();
    console.log(`[ExpressService] Started at ${address}`);
    console.log('[ExpressService] Health:', `${address}/health`);

    // Keep process alive
    process.stdin.resume();
  } catch (err) {
    console.error('Failed to start ExpressService standalone:', err);
    process.exit(1);
  }
}

startExpressStandalone();