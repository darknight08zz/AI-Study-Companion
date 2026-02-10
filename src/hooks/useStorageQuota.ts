import { useState, useEffect } from 'react';
import { indexedDBService } from '../services/indexedDB';

export function useStorageQuota() {
    const [usage, setUsage] = useState(0);
    const [quota, setQuota] = useState(0);
    const [percentage, setPercentage] = useState(0);
    const [isLowSpace, setIsLowSpace] = useState(false);

    const checkQuota = async () => {
        try {
            const { usage, quota } = await indexedDBService.getStorageEstimate();
            setUsage(usage);
            setQuota(quota);

            if (quota > 0) {
                const pct = (usage / quota) * 100;
                setPercentage(pct);
                setIsLowSpace(pct > 80);
            }
        } catch (e) {
            console.error("Failed to check storage quota", e);
        }
    };

    useEffect(() => {
        checkQuota();

    }, []);


    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return {
        usage,
        quota,
        percentage,
        isLowSpace,
        formattedUsage: formatBytes(usage),
        formattedQuota: formatBytes(quota),
        checkQuota
    };
}
