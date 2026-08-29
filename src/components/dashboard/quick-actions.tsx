import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPlus, FileScan, Pill, Headset } from 'lucide-react';

export function QuickActions() {
    return (
        <Card className="h-full glass-card border-none">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Your healthcare shortcuts.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
                <Button asChild size="lg" variant="outline" className="justify-start shadow-sm transition-all hover:scale-[1.02] hover:border-primary/50 hover:text-primary">
                    <Link href="/appointments">
                        <CalendarPlus className="mr-2 h-5 w-5" />
                        Book an Appointment
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="justify-start shadow-sm transition-all hover:scale-[1.02] hover:border-primary/50 hover:text-primary">
                    <Link href="/medications">
                        <Pill className="mr-2 h-5 w-5" />
                        Add New Medication
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="justify-start shadow-sm transition-all hover:scale-[1.02] hover:border-primary/50 hover:text-primary">
                    <Link href="/prescriptions">
                        <FileScan className="mr-2 h-5 w-5" />
                        Scan a Prescription
                    </Link>
                </Button>
                <div className="pt-4 border-t">
                    <Button asChild size="lg" className="justify-start w-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-sm transition-all hover:scale-[1.02]">
                        <Link href="/agent">
                            <Headset className="mr-2 h-5 w-5" />
                            Live Agent Dashboard
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
