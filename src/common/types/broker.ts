export interface MessageProducerBroker {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    sendMessage: (
        topic: string,
        message: string,
        key?: string,
    ) => Promise<void>;
}
