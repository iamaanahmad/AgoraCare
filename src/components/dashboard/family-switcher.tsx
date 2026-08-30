'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useFamily } from '@/contexts/family-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { UserPlus } from 'lucide-react';

export function FamilySwitcher() {
  const router = useRouter();
  const { members, selectedMember, setSelectedMember, loading } = useFamily();

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Family Circle</CardTitle>
                  <CardDescription>Manage care for your loved ones.</CardDescription>
              </CardHeader>
              <CardContent>
                  <p>Loading family members...</p>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="glass-card border-none overflow-hidden w-full max-w-full min-w-0">
      <CardHeader className="pb-4">
        <CardTitle>Family Circle</CardTitle>
        <CardDescription>Manage care for your loved ones.</CardDescription>
      </CardHeader>
      <CardContent className="w-full overflow-hidden">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none w-full min-w-0">
          {members.map((member) => {
            const avatar = PlaceHolderImages.find((img) => img.id === member.avatar);
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={cn(
                  'flex flex-col items-center space-y-3 rounded-2xl p-3 transition-all duration-300 hover:bg-secondary/50 hover:shadow-sm hover:-translate-y-1',
                  selectedMember.id === member.id && 'bg-primary/5 shadow-md ring-1 ring-primary/20'
                )}
              >
                <Avatar className={cn("h-16 w-16 border-2 border-background shadow-sm transition-all duration-300", selectedMember.id === member.id && "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background")}>
                  {avatar && (
                     <AvatarImage src={avatar.imageUrl} alt={member.firstName} data-ai-hint={avatar.imageHint} />
                  )}
                  <AvatarFallback>{member.firstName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-medium">{member.firstName}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </div>
              </button>
            );
          })}
           <Button 
             variant="outline" 
             className="flex h-auto flex-col items-center justify-center space-y-3 rounded-2xl border-dashed border-2 p-3 transition-all duration-300 hover:bg-secondary/50 hover:-translate-y-1 hover:border-primary/50" 
             style={{height: '136px', width: '104px'}}
             onClick={() => router.push('/profile')}
           >
            <UserPlus className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
             <div className="text-center">
                <p className="font-medium">Add</p>
                <p className="text-xs text-muted-foreground">Member</p>
              </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
