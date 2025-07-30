
import type { Timestamp } from "firebase/firestore";

export type EventType = 'dispensed' | 'reminder' | 'error' | 'info';

export interface Event {
  id: string;
  type: EventType;
  message: string;
  timestamp: Date;
}

export interface EventFromFirestore {
  type?: EventType;
  message: string;
  timestamp?: Timestamp;
  serverTimestamp?: number;
}
