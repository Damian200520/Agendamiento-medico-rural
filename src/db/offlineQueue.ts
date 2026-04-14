import { dbPromise } from "./indexedDb";

export type PendingAction = {
  id?: number;
  type: "BOOK_APPOINTMENT";
  payload: {
    appointmentId: number;
    specialty: string;
    doctor: string;
    date: string;
    time: string;
  };
  createdAt: string;
};

export async function addPendingAction(action: PendingAction) {
  const db = await dbPromise;
  await db.add("pendingActions", action);
}

export async function getPendingActions(): Promise<PendingAction[]> {
  const db = await dbPromise;
  return db.getAll("pendingActions");
}

export async function getPendingActionsCount(): Promise<number> {
  const db = await dbPromise;
  const actions = await db.getAll("pendingActions");
  return actions.length;
}

export async function clearPendingActions() {
  const db = await dbPromise;
  await db.clear("pendingActions");
}