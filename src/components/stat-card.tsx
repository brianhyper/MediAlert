import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | React.ReactNode;
    footer: string;
    color?: 'green' | 'orange' | 'blue' | 'purple';
}

const colorClasses = {
    green: 'text-green-500',
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
}

export function StatCard({ icon, title, value, footer, color = 'green' }: StatCardProps) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={cn("h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center", colorClasses[color])}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold flex items-center gap-2">{value}</div>
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">{footer}</p>
            </CardFooter>
        </Card>
    );
}
