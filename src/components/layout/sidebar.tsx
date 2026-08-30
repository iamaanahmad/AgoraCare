'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/data';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-14 group/sidebar flex-col glass border-none shadow-sm transition-all duration-300 ease-in-out hover:w-64 hover:shadow-2xl sm:flex overflow-hidden bg-background/60 hover:bg-background/95 backdrop-blur-xl">
      <nav className="flex flex-col gap-4 px-2 sm:py-5 w-full">
        <Link
          href="#"
          className="group/logo mb-2 ml-1 flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105 md:h-8 md:w-8 md:text-base relative"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 transition-all group-hover/logo:scale-110"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="sr-only">AgoraCare</span>
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
