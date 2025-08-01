 MediAlert: Smart Pill Dispenser Monitor

This is a Next.js web application designed to monitor a smart pill dispenser. It provides a real-time dashboard to track medication adherence, inventory levels, and device status, communicating directly with a Firebase Realtime Database for all its data needs.

 Core Features

- Real-Time Dashboard: At a glance, users can see four key statistics:
    - Pills Dispensed: The total number of pills successfully dispensed.
    - Late Picked Doses: The number of times a user required a reminder before taking their medication.
    - Weekly Adherence: A percentage score showing how consistently medication is taken on time.
    - Pills Left: The current inventory of pills in the dispenser.
- Event Feed: A live-updating feed shows a history of all dispenser activity, including dispensations, reminders, and system events.
- Browser Notifications: The application sends desktop notifications for critical events:
    - Medication dispensed.
    - Reminders to take medication.
    - Low stock alerts when inventory is running low.
    - Restock confirmations.
- Inventory Management: Users can easily "Restock" the dispenser by adding a specific quantity of pills.
- History Management: The event feed can be cleared without affecting the current pill inventory count.
- Device Status: Cards on the dashboard show the device's connectivity and health status.
- Theme Toggle: The UI supports both light and dark modes.

 Technical Logic & Database Communication

The application is built with Next.js and uses Firebase Realtime Database as its backend. All communication with the database is handled through Next.js Server Actions, located in `src/app/actions.ts`. This ensures that all critical business logic runs securely on the server.

 Firebase Realtime Database Structure

The database has a simple, flat structure designed for efficiency:

```json
{
  "dispense_events": {
    "-Nq...": { "message": "Pill dispensed.", "serverTimestamp": 167... },
    // ... more events
  },
  "reminders": {
    "-Nq...": { "message": "Time to take your pill.", "serverTimestamp": 167... },
    // ... more events
  },
  "inventory": {
    "pillsLeft": 25,
    "totalStock": 30
  },
  "processedEvents": {
    "-Nq...": true, // key is the dispense_event ID
    // ... more processed event IDs
  }
}
```

- `dispense_events`: A log of every time the physical dispenser has dropped a pill. Each entry has a unique ID, a message, and a timestamp.
- `reminders`: A log of reminder events, typically triggered when a pill is not taken on time.
- `inventory`: An object holding the core inventory state.
    - `pillsLeft`: The current number of pills available. This is the primary source of truth for inventory.
    - `totalStock`: The total number of pills in the current batch (set at the last restock).
- `processedEvents`: This is a crucial ledger that tracks which `dispense_events` have already been processed by the application to decrement the `pillsLeft` counter. This prevents a pill from being counted more than once.

 Server Actions (`src/app/actions.ts`)

The application's logic is centralized in three main server actions that use safe Firebase Transactions to prevent data corruption.

 `getAppData()`

This is the primary function for fetching all application data. It runs within a Firebase Transaction to ensure data consistency.

1.  Read Data: It reads the `dispense_events`, `reminders`, `inventory`, and `processedEvents` from the database.
2.  Process New Dispense Events: It compares the list of `dispense_events` against the `processedEvents` ledger.
3.  Decrement `pillsLeft`: For each new, unprocessed dispense event, it decrements the `inventory.pillsLeft` value by 1.
4.  Update Ledger: It adds the ID of the newly processed event to the `processedEvents` list so it won't be counted again.
5.  Return Data: It returns the complete list of events and the final, updated `pillsLeft` count to the client for display.

This transactional approach ensures that the `pillsLeft` count in the database is always accurate and is only reduced when a new pill drop is detected.

 `restockPills(quantity)`

This function handles adding new pills to the dispenser. It also uses a Firebase Transaction.

1.  Read Current Inventory: It reads the current `inventory` object.
2.  Add to Stock: It adds the `quantity` to both `pillsLeft` and `totalStock`. For example, if 10 pills are left and you add 30, `pillsLeft` becomes 40 and `totalStock` is also updated.
3.  Clear History: It removes all entries from `dispense_events`, `reminders`, and `processedEvents`. This resets the activity feed and counters for the new batch of medication.

 `clearHistory()`

This function allows the user to clear the event feed without impacting the pill count.

1.  Clear Event Logs: It removes all data from `dispense_events`, `reminders`, and `processedEvents`.
2.  Preserve Inventory: Crucially, it does not touch the `inventory` node. The `pillsLeft` and `totalStock` values remain unchanged.
