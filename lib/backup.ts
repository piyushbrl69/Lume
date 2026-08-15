// lib/backup.ts

const DB_NAME = 'LumeDB';
const STORE_NAME = 'attachments';

// Helper to open IndexedDB natively
function openNativeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert Base64 to Blob
const base64ToBlob = (base64: string): Blob => {
  const arr = base64.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export interface BackupData {
  version: number;
  timestamp: string;
  localStorageData: Record<string, string>;
  attachmentsData: Array<{ id: string; dataUrl: string }>;
}

export async function exportLumeBackup(): Promise<void> {
  // 1. Collect ALL localStorage keys without key filtering
  const localStorageData: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      localStorageData[key] = localStorage.getItem(key) || '';
    }
  }

  // 2. Collect IndexedDB attachments
  const attachmentsData: Array<{ id: string; dataUrl: string }> = [];
  try {
    const db = await openNativeDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const keys: IDBValidKey[] = await new Promise((res, rej) => {
      const req = store.getAllKeys();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });

    for (const id of keys) {
      const blob: Blob = await new Promise((res, rej) => {
        const req = store.get(id);
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });

      if (blob) {
        const dataUrl = await blobToBase64(blob);
        attachmentsData.push({ id: id.toString(), dataUrl });
      }
    }
  } catch (err) {
    console.warn("IndexedDB export warning:", err);
  }

  // 3. Assemble and download complete backup
  const backup: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    localStorageData,
    attachmentsData,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lume-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importLumeBackup(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const backup: BackupData = JSON.parse(text);

        if (!backup.localStorageData) {
          throw new Error("Invalid backup payload.");
        }

        // Restore all localStorage items
        Object.entries(backup.localStorageData).forEach(([key, val]) => {
          localStorage.setItem(key, val);
        });

        // Restore IndexedDB blobs
        if (backup.attachmentsData && backup.attachmentsData.length > 0) {
          const db = await openNativeDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);

          for (const item of backup.attachmentsData) {
            const blob = base64ToBlob(item.dataUrl);
            store.put(blob, item.id);
          }

          await new Promise((res, rej) => {
            tx.oncomplete = () => res(true);
            tx.onerror = () => rej(tx.error);
          });
        }

        resolve(true);
      } catch (err) {
        console.error("Failed to restore backup:", err);
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}