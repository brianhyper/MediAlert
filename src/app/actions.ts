'use server';

import { db } from '@/lib/firebase';
import { get, ref, child, remove } from 'firebase/database';
import type { Event, EventFromFirestore } from '@/lib/types';

export async function getEvents(): Promise<Event[]> {
    console.log("Attempting to fetch events from Realtime Database...");
    try {
        const dbRef = ref(db);

        const [dispenseSnapshot, reminderSnapshot] = await Promise.all([
            get(child(dbRef, 'dispense_events')),
            get(child(dbRef, 'reminders'))
        ]);

        const events: Event[] = [];

        if (dispenseSnapshot.exists()) {
            const dispenseData = dispenseSnapshot.val();
            console.log(`Fetched ${Object.keys(dispenseData).length} dispense events.`);
            for (const key in dispenseData) {
                const event: EventFromFirestore = dispenseData[key];
                if (event.serverTimestamp) {
                    events.push({
                        id: key,
                        type: 'dispensed',
                        message: event.message,
                        timestamp: new Date(event.serverTimestamp)
                    });
                }
            }
        } else {
            console.log("No dispense_events data available");
        }

        if (reminderSnapshot.exists()) {
            const reminderData = reminderSnapshot.val();
            console.log(`Fetched ${Object.keys(reminderData).length} reminder events.`);
            for (const key in reminderData) {
                const event: EventFromFirestore = reminderData[key];
                if (event.serverTimestamp) {
                    events.push({
                        id: key,
                        type: 'reminder',
                        message: event.message,
                        timestamp: new Date(event.serverTimestamp)
                    });
                }
            }
        } else {
            console.log("No reminders data available");
        }

        const sortedEvents = events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        console.log(`Successfully processed and sorted ${sortedEvents.length} total events.`);
        return sortedEvents;

    } catch (error) {
        console.error("Error fetching events from Realtime Database:", error);
        return [];
    }
}


export async function clearEvents(): Promise<{ success: boolean; error?: string }> {
    console.log("Attempting to clear event history from Realtime Database...");
    try {
        const dbRef = ref(db);
        await Promise.all([
            remove(child(dbRef, 'dispense_events')),
            remove(child(dbRef, 'reminders'))
        ]);
        console.log("Successfully cleared event history.");
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error clearing event history:", errorMessage);
        return { success: false, error: errorMessage };
    }
}