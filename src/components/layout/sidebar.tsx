'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/data';
import { AgoraCareLogo } from '@/components/ui/logo';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-14 group/sidebar flex-col glass border-none shadow-sm transition-all duration-300 ease-in-out hover:w-64 hover:shadow-2xl sm:flex overflow-hidden bg-background/60 hover:bg-background/95 backdrop-blur-xl">
      <nav className="flex flex-col gap-4 px-2 sm:py-5 w-full">
        <Link
          href="/"
          className="mb-2 ml-0.5 flex items-center transition-transform hover:scale-105"
        >
          <AgoraCareLogo size={32} showText={false} />
        </Link>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 w-full items-center rounded-xl text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary relative group/navitem overflow-hidden',
                isActive && 'bg-primary/15 text-primary font-semibold shadow-sm'
              )}
            >
              {/* Icon Container (Fixed Width) */}
              <div className="flex w-10 shrink-0 items-center justify-center h-full">
                <item.icon className="h-5 w-5" />
              </div>
              
              {/* Text Container (Expands) */}
              <span className="whitespace-nowrap opacity-0 translate-x-[-10px] transition-all duration-300 ease-in-out group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 ml-2">
                {item.title}
              </span>

              {/* Tooltip for collapsed state (CSS only) */}
              <div className="absolute left-14 px-2 py-1 ml-2 rounded-md bg-popover text-popover-foreground text-sm shadow-md opacity-0 pointer-events-none group-hover/navitem:opacity-100 group-hover/sidebar:!opacity-0 transition-opacity whitespace-nowrap z-50 border">
                {item.title}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
