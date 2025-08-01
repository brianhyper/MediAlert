
'use client';

import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/stat-card';
import { EventFeed } from '@/components/event-feed';
import { Pill, CalendarOff, LineChart, Loader, RefreshCw, Package } from 'lucide-react';
import { useEffect, useState, useTransition, useCallback, useRef } from 'react';
import type { Event } from '@/lib/types';
import { getAppData, clearHistory, restockPills } from './actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/layout/footer';

const LOW_STOCK_THRESHOLD = 3;

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pillsLeft, setPillsLeft] = useState(0);
  const [pillsDispensed, setPillsDispensed] = useState(0);
  const [latePickedDoses, setLatePickedDoses] = useState(0);
  const [adherence, setAdherence] = useState(100);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  // Ref to store the ID of the last processed event to prevent duplicate notifications
  const lastProcessedEventId = useRef<string | null>(null);

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const handleFetchData = useCallback(() => {
    startTransition(async () => {
        const { events: fetchedEvents, pillsLeft: fetchedPillsLeft } = await getAppData();
        
        // --- Notification Logic ---
        // This logic runs only when new data is fetched.
        if (fetchedEvents.length > 0) {
            const latestEvent = fetchedEvents[0];
            
            // Only show notification for new, unseen events
            if (latestEvent.id !== lastProcessedEventId.current) {
                lastProcessedEventId.current = latestEvent.id;

                const stockBeforeThisEvent = latestEvent.type === 'dispensed' ? fetchedPillsLeft + 1 : fetchedPillsLeft;
                
                if (stockBeforeThisEvent <= 0) {
                     // If stock was already zero, any new event should just trigger a restock reminder.
                    showNotification('Dispenser is empty', "Please refill the dispenser to continue.");
                } else {
                    // Stock was available before this event.
                    if (latestEvent.type === 'dispensed') {
                        showNotification('Medication Dispensed', latestEvent.message);
                        // Send a low stock alert if the new count is low
                        if (fetchedPillsLeft > 0 && fetchedPillsLeft <= LOW_STOCK_THRESHOLD) {
                            showNotification('Low Stock Alert', `Only ${fetchedPillsLeft} pills remaining. Please refill soon.`);
                        }
                    } else if (latestEvent.type === 'reminder') {
                        // Only show reminder if there are pills to take.
                        showNotification('Reminder', latestEvent.message);
                    }
                }
            }
        }

        setEvents(fetchedEvents);
        setPillsLeft(fetchedPillsLeft);
    });
  }, []);


  useEffect(() => {
    // --- Stat Calculation Logic ---
    // This effect recalculates stats ONLY when events or pillsLeft change.
    
    const dispenseEvents = events.filter(event => event.type === 'dispensed');
    const reminderEvents = events.filter(event => event.type === 'reminder');
    
    // Count dispense events that happened when stock > 0
    let dispensedWhenInStock = 0;
    // Iterate backwards from most recent dispense event
    for (let i = 0; i < dispenseEvents.length; i++) {
        // Pills left *before* this dispense event occurred
        const stockAtTimeOfEvent = pillsLeft + (i + 1);
        if (stockAtTimeOfEvent > 0) {
            dispensedWhenInStock++;
        }
    }
    setPillsDispensed(dispensedWhenInStock);

    // Count reminder events that happened when stock > 0
    let lateDosesWhenInStock = 0;
    for (const rEvent of reminderEvents) {
        // Find how many pills were dispensed between the reminder and now
        const dispensationsAfterReminder = dispenseEvents.filter(dEvent => dEvent.timestamp > rEvent.timestamp).length;
        // Calculate stock at the time of the reminder
        const stockAtTimeOfReminder = pillsLeft + dispensationsAfterReminder;
        if (stockAtTimeOfReminder > 0) {
            lateDosesWhenInStock++;
        }
    }
    setLatePickedDoses(lateDosesWhenInStock);

    // Calculate Adherence
    const totalDoses = dispensedWhenInStock + lateDosesWhenInStock;
    if (totalDoses > 0) {
      setAdherence(Math.round((dispensedWhenInStock / totalDoses) * 100));
    } else {
      setAdherence(100); // If no doses recorded, adherence is 100%
    }
    
  }, [events, pillsLeft]);


  const handleClearHistory = async () => {
    const result = await clearHistory();
    if (result.success) {
      toast({ title: "Success", description: "Event history has been cleared." });
      handleFetchData(); 
    } else {
      toast({ variant: 'destructive', title: "Error", description: `Failed to clear history: ${result.error}` });
    }
  };

  const handleRestock = async (quantity: number) => {
    const result = await restockPills(quantity);
    if (result.success) {
      const successMessage = `${quantity} pills have been added to the inventory.`;
      toast({ title: "Success", description: successMessage });
      showNotification("Inventory Restocked", successMessage);
      handleFetchData();
    } else {
      toast({ variant: 'destructive', title: "Error", description: `Failed to restock: ${result.error}` });
    }
    return result.success;
  }

  useEffect(() => {
    // Initial data fetch
    handleFetchData();
    // Set up interval to fetch data every 10 seconds
    const intervalId = setInterval(handleFetchData, 10000);
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [handleFetchData]); 

  const lastEvent = events[0];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <Header 
          lastEvent={lastEvent}
          onClearHistory={handleClearHistory} 
          onRestock={handleRestock}
        />
        <div className="grid gap-6 mt-6">
          <div className="flex justify-end mb-4">
              <Button onClick={handleFetchData} disabled={isPending}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                  Refresh Data
              </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <StatCard 
              icon={<Pill className="text-green-500" />}
              title="Pills Dispensed"
              value={isPending && events.length === 0 ? <Loader className="animate-spin" /> : pillsDispensed.toString()}
              footer="Total dispensed"
              color="green"
            />
            <StatCard 
              icon={<CalendarOff className="text-orange-500" />}
              title="Late Picked Doses"
              value={isPending && events.length === 0 ? <Loader className="animate-spin" /> : latePickedDoses.toString()}
              footer="Requires a reminder"
              color="orange"
            />
            <StatCard 
              icon={<LineChart className="text-purple-500" />}
              title="Weekly Adherence"
              value={isPending && events.length === 0 ? <Loader className="animate-spin" /> : `${adherence}%`}
              footer="+5% this week"
              color="purple"
            />
            <StatCard 
              icon={<Package className="text-blue-500" />}
              title="Pills Left"
              value={isPending && events.length === 0 ? <Loader className="animate-spin" /> : pillsLeft.toString()}
              footer={pillsLeft <= 0 ? "Dispenser empty" : (pillsLeft <= LOW_STOCK_THRESHOLD ? "Restock needed" : "Sufficient stock")}
              color="blue"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <EventFeed events={events} loading={isPending && events.length === 0} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
