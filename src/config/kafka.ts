import { Kafka, Producer } from "kafkajs";
import { MessageProducerBroker } from "../common/types/broker";

export class KafkaProducerBroker implements MessageProducerBroker {
    private producer: Producer;
    constructor(clientId: string, brokers: string[]) {
        const kafka = new Kafka({ clientId, brokers });
        this.producer = kafka.producer();
    }

    async connect() {
        await this.producer.connect();
    }

    async disconnect() {
        if (this.producer) {
            await this.producer.disconnect();
        }
    }

    async sendMessage(topic: string, message: string, key?: string) {
        const data: { value: string; key?: string } = {
            value: message,
        };
        if (key) {
            data.key = key;
        }
        await this.producer.send({
            topic,
            messages: [data],
        });
    }
}
