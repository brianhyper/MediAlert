
'use client';

import { Card } from "@/components/ui/card";
import { Pill, AlarmClockCheck, AlertTriangle, Info } from "lucide-react";
import type { Event, EventType } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const eventConfig: Record<EventType, { icon: React.ReactNode; borderClass: string; title: string }> = {
    dispensed: {
        icon: <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />,
        borderClass: 'border-l-4 border-green-500 dark:border-green-400',
        title: 'Pill Dispensed'
    },
    reminder: {
        icon: <AlarmClockCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
        borderClass: 'border-l-4 border-blue-500 dark:border-blue-400',
        title: 'Reminder'
    },
    error: {
        icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />,
        borderClass: 'border-l-4 border-red-500 dark:border-red-400',
        title: 'System Error'
    },
    info: {
        icon: <Info className="h-5 w-5 text-slate-600 dark:text-slate-400" />,
        borderClass: 'border-l-4 border-slate-500 dark:border-slate-400',
        title: 'System Info'
    },
};

export function EventCard({ event }: { event: Event }) {
    const config = eventConfig[event.type];
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        if(event?.timestamp) {
            setTimeAgo(formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }));
        }
    }, [event.timestamp]);


    if (!event || !config) {
        return null;
    }
    
    return (
        <Card className={cn("w-full transition-shadow hover:shadow-md", config.borderClass)}>
            <div className="p-4 flex items-start space-x-4">
                <div className="flex-shrink-0 pt-0.5">
                    {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {config.title}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                           {timeAgo || '...'}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {event.message}
                    </p>
                </div>
            </div>
        </Card>
    );
}
