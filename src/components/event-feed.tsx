'use client';

import { EventCard } from './event-card';
import type { Event } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Info, CheckCircle, AlertTriangle, Wifi, Loader } from 'lucide-react';

export function EventFeed({ events, loading }: { events: Event[], loading: boolean }) {
    const lastDispensedEvent = events.find(e => e.type === 'dispensed');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                       <CheckCircle className="text-green-500" />
                        Current Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="flex items-center gap-2"><Loader className="animate-spin" /> Loading...</div> :
                        lastDispensedEvent ? (
                            <>
                                <p>{lastDispensedEvent.message}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(lastDispensedEvent.timestamp).toLocaleTimeString()}
                                </p>
                            </>
                        ) : <p>No dispensation events yet.</p>
                    }
                </CardContent>
            </Card>

             <Card className="shadow-sm border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <AlertTriangle className="text-blue-500" />
                        Device Health
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>All systems operational and connected</p>
                    <p className="text-sm text-muted-foreground mt-1">System check 5 minutes ago</p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Activity />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>Real-time updates from your pill dispenser.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                        {loading ? (
                             <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 h-[calc(100vh-400px)] justify-center">
                                <Loader className="w-12 h-12 text-muted-foreground/50 animate-spin" />
                                <p className="text-md">Loading Real-time Events...</p>
                            </div>
                        ) : events.length === 0 ? (
                             <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4 h-[calc(100vh-400px)] justify-center">
                                <Info className="w-12 h-12 text-muted-foreground/50" />
                                <p className="text-md">No events yet.</p>
                                <p className="text-sm">Waiting for dispenser activity...</p>
                            </div>
                        ) : (
                           events.map(event => (
                               <EventCard key={event.id} event={event} />
                           ))
                        )}
                    </div>
                </CardContent>
            </Card>
             <Card className="shadow-sm border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Wifi className="text-green-500" />
                        Connectivity Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <p>ESP8266 module connected and transmitting data normally</p>
                </CardContent>
            </Card>
        </div>
    );
}
