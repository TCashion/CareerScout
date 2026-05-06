import { Firestore } from "@google-cloud/firestore";

import type { SeenJobRecord, SeenJobsStore } from "@careerscout/core/types";

export class InMemorySeenJobsStore implements SeenJobsStore {
  private readonly records = new Map<string, SeenJobRecord>();

  async hasSeen(fingerprint: string): Promise<boolean> {
    return this.records.has(fingerprint);
  }

  async markSeen(record: SeenJobRecord): Promise<void> {
    this.records.set(record.fingerprint, record);
  }
}

type FirestoreSeenJobsStoreOptions = {
  projectId?: string;
  collectionName?: string;
};

export class FirestoreSeenJobsStore implements SeenJobsStore {
  private readonly firestore: Firestore;
  private readonly collectionName: string;

  constructor(options: FirestoreSeenJobsStoreOptions = {}) {
    this.firestore = new Firestore(
      options.projectId ? { projectId: options.projectId } : {}
    );
    this.collectionName =
      options.collectionName ?? process.env.FIRESTORE_COLLECTION_NAME ?? "seenJobs";
  }

  async hasSeen(fingerprint: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection(this.collectionName)
      .doc(fingerprint)
      .get();

    return snapshot.exists;
  }

  async markSeen(record: SeenJobRecord): Promise<void> {
    await this.firestore
      .collection(this.collectionName)
      .doc(record.fingerprint)
      .set(record, { merge: true });
  }
}
