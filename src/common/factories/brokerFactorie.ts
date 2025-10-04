import { MessageProducerBroker } from "../types/broker";
import config from "config";
import { KafkaProducerBroker } from "../../config/kafka";

let messageProducer: MessageProducerBroker | null = null;

export const createMessageProducerBroker = (): MessageProducerBroker => {
    // making singleton
    if (!messageProducer) {
        messageProducer = new KafkaProducerBroker("catalog-service", [
            config.get("kafka.broker"),
        ]);
    }

    return messageProducer;
};
