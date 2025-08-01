
'use server';

import { db } from '@/lib/firebase';
import { ref, child, remove, runTransaction } from 'firebase/database';
import type { Event, EventFromFirestore } from '@/lib/types';

export interface AppData {
    events: Event[];
    pillsLeft: number;
}

export async function getAppData(): Promise<AppData> {
    console.log("Attempting to fetch and process app data from Realtime Database...");
    const dbRef = ref(db);
    
    try {
        let finalAppData: AppData = { events: [], pillsLeft: 0 };

        await runTransaction(dbRef, (currentData) => {
            if (currentData) {
                const events: Event[] = [];
                const dispenseData = currentData.dispense_events || {};
                const reminderData = currentData.reminders || {};
                const inventory = currentData.inventory || { totalStock: 0, pillsLeft: 0 };
                const processedEvents = currentData.processedEvents || {};

                // --- This is the new logic for decrementing pillsLeft ---
                let newDispenseCount = 0;
                for (const key in dispenseData) {
                    // Check if this event has already been processed.
                    // If not, it's a new pill drop.
                    if (!processedEvents[key]) {
                        newDispenseCount++;
                        // Mark this event as processed so it's not counted again.
                        processedEvents[key] = true;
                    }

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

                // Decrement pillsLeft in the database by the number of new pill drops.
                if (newDispenseCount > 0) {
                    const currentPills = inventory.pillsLeft || 0;
                    inventory.pillsLeft = Math.max(0, currentPills - newDispenseCount);
                }
                
                // Update the database with the new state.
                currentData.inventory = inventory;
                currentData.processedEvents = processedEvents;

                // Add reminders to the event list for the client app.
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
                
                // Prepare the final data to be returned to the client app.
                const sortedEvents = events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                finalAppData = { events: sortedEvents, pillsLeft: inventory.pillsLeft };
            }
            // Return the modified data to be written back to Firebase.
            return currentData;
        });
        
        console.log(`Successfully processed data. Pills left: ${finalAppData.pillsLeft}`);
        return finalAppData;

    } catch (error) {
        console.error("Error in getAppData transaction:", error);
        return { events: [], pillsLeft: 0 };
    }
}

export async function clearHistory(): Promise<{ success: boolean; error?: string }> {
    console.log("Attempting to clear event history from Realtime Database...");
    try {
        const dbRef = ref(db);
        // This will clear the event logs and the processed events tracker.
        // Crucially, it will NOT touch the inventory.pillsLeft value.
        await Promise.all([
            remove(child(dbRef, 'dispense_events')),
            remove(child(dbRef, 'reminders')),
            remove(child(dbRef, 'processedEvents'))
        ]);
        console.log("Successfully cleared event history and processed events log.");
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error clearing history:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

export async function restockPills(quantity: number): Promise<{ success: boolean; error?: string }> {
    if (quantity <= 0) {
        return { success: false, error: "Quantity must be a positive number." };
    }
    console.log(`Attempting to add ${quantity} pills to stock...`);
    const dbRef = ref(db);

    try {
        await runTransaction(child(dbRef, 'inventory'), (currentInventory) => {
            if (currentInventory) {
                // Add to the existing stock
                currentInventory.pillsLeft = (currentInventory.pillsLeft || 0) + quantity;
                currentInventory.totalStock = (currentInventory.totalStock || 0) + quantity;
            } else {
                // If inventory doesn't exist, create it
                currentInventory = {
                    pillsLeft: quantity,
                    totalStock: quantity,
                };
            }
            return currentInventory;
        });

        // After restocking, clear event logs and the processed events tracker.
        await Promise.all([
            remove(child(dbRef, 'dispense_events')),
            remove(child(dbRef, 'reminders')),
            remove(child(dbRef, 'processedEvents'))
        ]);

        console.log(`Successfully added ${quantity} pills. History cleared.`);
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error restocking pills:", errorMessage);
        return { success: false, error: errorMessage };
    }
}
