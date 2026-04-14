import { openDB } from "idb";

export const dbPromise = openDB("agendamiento-medico-rural-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("pendingActions")) {
      db.createObjectStore("pendingActions", {
        keyPath: "id",
        autoIncrement: true,
      });
    }
  },
});