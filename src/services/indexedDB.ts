import { openDB, DBSchema } from 'idb';

interface StudyCompanionDB extends DBSchema {
    files: {
        key: string;
        value: Blob;
    };
    // Future: We could store 'materials' here for offline access
}

const DB_NAME = 'study-companion-db';
const DB_VERSION = 1;

export class IndexedDBService {
    private async getDB() {
        return openDB<StudyCompanionDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files');
                }
            },
        });
    }

    async saveFile(id: string, file: Blob): Promise<void> {
        const db = await this.getDB();
        await db.put('files', file, id);
    }

    async getFile(id: string): Promise<Blob | undefined> {
        const db = await this.getDB();
        return await db.get('files', id);
    }

    async deleteFile(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete('files', id);
    }

    async clearAllFiles(): Promise<void> {
        const db = await this.getDB();
        await db.clear('files');
    }

    async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0
            };
        }
        return { usage: 0, quota: 0 };
    }
}

export const indexedDBService = new IndexedDBService();
