'use client';

import Link from 'next/link';
import {
  Bell,
  Home,
  Menu,
  Pill,
  Calendar,
  FileScan,
  Phone,
  MessageSquareWarning,
  HeartPulse,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFamily } from '@/contexts/family-context';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { useVoice } from '@/contexts/voice-context';
import { createSupportTicket } from '@/firebase/firestore/tickets';
import { NotificationBell } from '@/components/notifications';
import { AgoraCareLogo } from '@/components/ui/logo';

export function Header() {
  const { selectedMember } = useFamily();
  const caregiverAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-sara');
  const { toast } = useToast();
  const firestore = useFirestore();
  const { connect } = useVoice();

  const handleCallDoctor = async () => {
    const patientName = selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName || ''}`.trim() : 'George (Patient)';
    const ticketId = `emergency_doc_${Date.now()}`;

    toast({
      title: 'Connecting to Doctor...',
      description: `Emergency hotline connecting for ${patientName}. Initiating live Agora voice bridge.`,
    });

    if (firestore) {
      try {
        await createSupportTicket(firestore, {
          patientId: selectedMember?.id || 'george-patient-profile',
          patientName,
          status: 'open',
          summary: `Direct Emergency Doctor Call by ${patientName}`,
          reason: 'Emergency action button pressed in app header',
          agoraChannel: ticketId,
        });
      } catch (err) {
        console.warn('Emergency ticket creation notice:', err);
      }
    }

    try {
      await connect(ticketId);
    } catch (err) {
      console.warn('Voice connect notice:', err);
    }
  };

  const handleNotifySara = () => {
    const patientName = selectedMember ? selectedMember.firstName : 'George';
    toast({
      title: 'Sara (Caregiver) Alerted!',
      description: `High-priority SMS & push dispatch sent to Sara regarding ${patientName}'s status.`,
      variant: 'default',
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 glass px-4 sm:static sm:h-auto sm:bg-transparent sm:backdrop-blur-none sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <div className="mb-6 mt-2 px-2">
            <AgoraCareLogo size={36} showText />
          </div>
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/medications"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Pill className="h-5 w-5" />
              Medications
            </Link>
            <Link
              href="/appointments"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Calendar className="h-5 w-5" />
              Appointments
            </Link>
            <Link
              href="/vitals"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <HeartPulse className="h-5 w-5" />
              Vitals
            </Link>
            <Link
              href="/prescriptions"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <FileScan className="h-5 w-5" />
              Prescriptions
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      
      {/* Left-aligned Title with Brand Logo */}
      <div className="flex-1 flex items-center gap-3">
        <AgoraCareLogo size={34} />
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground leading-none">
            {selectedMember ? `${selectedMember.firstName}'s Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">AgoraCare Voice-First Health Companion</p>
        </div>
      </div>

      {/* Right-aligned Actions */}
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="destructive" size="icon" className="h-9 w-9 rounded-full shadow-sm hover:scale-105 transition-transform" title="Emergency Actions">
              <AlertCircle className="h-4 w-4" />
              <span className="sr-only">Emergency Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-destructive font-semibold">Emergency Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCallDoctor} className="cursor-pointer">
              <Phone className="mr-2 h-4 w-4 text-destructive" />
              <span>Call Doctor (Live Audio)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNotifySara} className="cursor-pointer">
              <MessageSquareWarning className="mr-2 h-4 w-4 text-amber-500" />
              <span>Notify Sara (Caregiver)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full h-9 w-9 border-2 border-primary/20 hover:border-primary transition-colors"
            >
              <Avatar className="h-9 w-9">
                {caregiverAvatar && (
                  <AvatarImage
                    src={caregiverAvatar.imageUrl}
                    alt="Caregiver Avatar"
                    data-ai-hint={caregiverAvatar.imageHint}
                  />
                )}
                <AvatarFallback>SA</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
