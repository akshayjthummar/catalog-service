import app from "./app";
import { createMessageProducerBroker } from "./common/factories/brokerFactorie";
import { MessageProducerBroker } from "./common/types/broker";
import { initDB } from "./config/db";
import logger from "./config/logger";
import config from "config";

const startServer = async () => {
    const PORT: number = config.get("server.port") || 5502;
    let messageProduccerBroker: MessageProducerBroker | null = null;
    try {
        await initDB();
        logger.info("Database connection successfully");
        // connect kafka
        messageProduccerBroker = createMessageProducerBroker();
        await messageProduccerBroker.connect();
        app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (messageProduccerBroker) {
                await messageProduccerBroker.disconnect();
            }
            logger.error(err.message);
            logger.on("finish", () => {
                process.exit(1);
            });
        }
    }
};

void startServer();
