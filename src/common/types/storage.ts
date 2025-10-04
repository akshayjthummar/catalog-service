export interface FileData {
    fileName: string;
    fileData: ArrayBuffer;
}
export interface FileStorage {
    upload(data: FileData): Promise<void>;
    delete(fileName: string): Promise<void>;
    getObjectUri(fileName: string): string;
}

export function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
