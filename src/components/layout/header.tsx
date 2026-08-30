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
import { NotificationBell } from '@/components/notifications';

export function Header() {
  const { selectedMember } = useFamily();
  const caregiverAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-sara');

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
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="sr-only">AgoraCare</span>
            </Link>
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
      
      {/* Left-aligned Title */}
      <div className="flex-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground">
          {selectedMember ? `${selectedMember.firstName}'s Dashboard` : 'Dashboard'}
        </h1>
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-destructive font-semibold">Emergency Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Phone className="mr-2 h-4 w-4 text-destructive" />
              <span>Call Doctor</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
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
