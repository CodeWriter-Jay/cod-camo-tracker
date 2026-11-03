/** 用户导入的迷彩图片存放在 IndexedDB，键为图片文件名 */
const DB_NAME = "cod-camo-tracker";
const STORE_NAME = "images";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return openDatabase().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = action(transaction.objectStore(STORE_NAME));
        transaction.oncomplete = () => {
          db.close();
          resolve(request ? request.result : undefined);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("IndexedDB transaction failed"));
        };
      }),
  );
}

export async function loadImportedImages(): Promise<Map<string, Blob>> {
  const images = new Map<string, Blob>();
  await runTransaction("readonly", (store) => {
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      images.set(String(cursor.key), cursor.value as Blob);
      cursor.continue();
    };
  });
  return images;
}

export async function saveImportedImages(images: Map<string, Blob>): Promise<void> {
  await runTransaction("readwrite", (store) => {
    for (const [name, blob] of images) store.put(blob, name);
  });
}
