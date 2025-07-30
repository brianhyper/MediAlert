
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Bell, Wifi, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationSettings } from "@/components/notification-settings";
import { type Event } from '@/lib/types';
import { format } from 'date-fns';

export function Header({ onClearHistory, lastEvent }: { onClearHistory: () => void; lastEvent?: Event; }) {
    const [lastActivity, setLastActivity] = useState('No recent activity');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (lastEvent) {
            const activity = `${format(lastEvent.timestamp, 'HH:mm')} - ${lastEvent.type === 'dispensed' ? 'Medication Dispensed' : lastEvent.message}`;
            setLastActivity(activity);
        } else if (isClient) {
            setLastActivity('No recent activity');
        }
    }, [lastEvent, isClient]);

    return (
        <header className="bg-primary text-primary-foreground rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                    <div className="bg-primary-foreground/20 p-3 rounded-full">
                        <Heart className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">MediAlert</h1>
                        <p className="text-sm opacity-80">Smart Pill Dispenser Monitor</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1.5 bg-green-500 text-white border-green-600">
                        <Wifi className="h-3 w-3" />
                        <span className="font-medium">Connected</span>
                    </Badge>
                </div>
            </div>

            <div className="flex justify-between items-end mt-4">
                <div>
                    <p className="text-xs uppercase opacity-80 tracking-wider">Last Activity</p>
                    <p className="font-semibold text-lg">{isClient ? lastActivity : 'Loading...'}</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-4 md:mt-0">
                     <Button variant="ghost" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground justify-start md:justify-center">
                        <Bell className="h-4 w-4 mr-1.5" />
                        Alerts
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground justify-start md:justify-center">
                                <Settings className="h-4 w-4 mr-1.5" />
                                Settings
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel>App Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                                <div className="p-2">
                                <ThemeToggle />
                                </div>
                            <NotificationSettings onClearHistory={onClearHistory} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
