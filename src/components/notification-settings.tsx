'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, Trash2 } from 'lucide-react';

export function NotificationSettings({ onClearHistory }: { onClearHistory: () => void }) {
    const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if ('Notification' in window) {
            setIsNotificationPermissionGranted(Notification.permission === 'granted');
        }
    }, []);

    const handleNotificationToggle = async (enabled: boolean) => {
        if (enabled) {
            if (!('Notification' in window)) {
                toast({ variant: 'destructive', title: 'Error', description: 'This browser does not support desktop notifications.' });
                return;
            }

            if (Notification.permission === 'granted') {
                setIsNotificationPermissionGranted(true);
                new Notification('PillWise Monitor', { body: 'Notifications are enabled!' });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setIsNotificationPermissionGranted(true);
                    new Notification('PillWise Monitor', { body: 'Notifications enabled successfully!' });
                } else {
                     toast({ title: 'Info', description: 'Notification permission was not granted.' });
                }
            } else {
                toast({ variant: 'destructive', title: 'Permission Denied', description: 'Please enable notifications in your browser settings.' });
            }
        } else {
            setIsNotificationPermissionGranted(false);
            toast({ title: 'Info', description: 'Notifications have been disabled in the app. You can re-enable them anytime.' });
        }
    };

    return (
        <div className="p-2 space-y-4">
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="notifications" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4" />
                    <span>Push Alerts</span>
                </Label>
                <Switch
                    id="notifications"
                    checked={isNotificationPermissionGranted}
                    onCheckedChange={handleNotificationToggle}
                    aria-label="Toggle push notifications"
                />
            </div>
            <Button variant="outline" className="w-full justify-start" onClick={onClearHistory}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Event History
            </Button>
        </div>
    );
}
