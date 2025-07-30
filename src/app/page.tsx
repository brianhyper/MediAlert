
'use client';

import { Header } from '@/components/layout/header';
import { StatCard } from '@/components/stat-card';
import { EventFeed } from '@/components/event-feed';
import { Pill, CalendarOff, LineChart, Loader, Info, RefreshCw } from 'lucide-react';
import { useEffect, useState, useTransition, useCallback } from 'react';
import type { Event } from '@/lib/types';
import { getEvents, clearEvents } from './actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/layout/footer';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFetchEvents = useCallback(() => {
    startTransition(async () => {
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
    });
  }, [startTransition]);

  const handleClearHistory = async () => {
    const result = await clearEvents();
    if (result.success) {
      toast({ title: "Success", description: "Event history has been cleared." });
      handleFetchEvents(); // Refresh the data to show it's empty
    } else {
      toast({ variant: 'destructive', title: "Error", description: `Failed to clear history: ${result.error}` });
    }
  }

  useEffect(() => {
    handleFetchEvents();
    const intervalId = setInterval(handleFetchEvents, 10000); // Auto-refresh every 10 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [handleFetchEvents]);

  const lastEvent = events[0];

  const pillsDispensed = events.filter(e => e.type === 'dispensed').length;
  const latePickedDoses = events.filter(e => e.type === 'reminder').length;
  const infoEvents = events.filter(e => e.type === 'info').length;
  
  const [adherence, setAdherence] = useState(0);

  useEffect(() => {
    if (events.length > 0) {
      const totalDoses = pillsDispensed + latePickedDoses;
      if (totalDoses > 0) {
        setAdherence(Math.round((pillsDispensed / totalDoses) * 100));
      } else {
        setAdherence(100);
      }
    } else {
      setAdherence(100);
    }
  }, [pillsDispensed, latePickedDoses, events.length]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <Header 
          lastEvent={lastEvent}
          onClearHistory={handleClearHistory} 
        />
        <div className="grid gap-6 mt-6">
          <div className="flex justify-end mb-4">
              <Button onClick={handleFetchEvents} disabled={isPending}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                  Refresh Data
              </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <StatCard 
              icon={<Pill className="text-green-500" />}
              title="Pills Dispensed Today"
              value={isPending ? <Loader className="animate-spin" /> : pillsDispensed.toString()}
              footer="+1 from yesterday"
              color="green"
            />
            <StatCard 
              icon={<CalendarOff className="text-orange-500" />}
              title="Late Picked Doses"
              value={isPending ? <Loader className="animate-spin" /> : latePickedDoses.toString()}
              footer="Requires a reminder"
              color="orange"
            />
            <StatCard 
              icon={<LineChart className="text-purple-500" />}
              title="Weekly Adherence"
              value={isPending ? <Loader className="animate-spin" /> : `${adherence}%`}
              footer="+5% this week"
              color="purple"
            />
            <StatCard 
              icon={<Info className="text-blue-500" />}
              title="System Info Events"
              value={isPending ? <Loader className="animate-spin" /> : infoEvents.toString()}
              footer="Total informational events"
              color="blue"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <EventFeed events={events} loading={isPending} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
