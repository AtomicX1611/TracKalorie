import { createApp } from './app.js';
import { connectDB, disconnectDB } from './common/config/database.js';
import { config, validateConfig } from './common/config/config.js';
async function main() {
    validateConfig();
    await connectDB();
    const app = createApp();
    const server = app.listen(config.node.port, () => {
        console.log(`✓ TracKalorie server running on http://localhost:${config.node.port} [${config.node.env}]`);
        console.log(`✓ Auth: JWT (access=${config.jwt.expiresIn}, refresh=7d)`);
    });
    const shutdown = async (signal) => {
        console.log(`\n${signal} received — shutting down gracefully...`);
        server.close(async () => {
            await disconnectDB();
            console.log('Clean shutdown complete');
            process.exit(0);
        });
        setTimeout(() => {
            console.error(' Graceful shutdown timed out — forcing exit');
            process.exit(1);
        }, 10_000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection:', reason);
        shutdown('UNHANDLED_REJECTION');
    });
}
main().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});