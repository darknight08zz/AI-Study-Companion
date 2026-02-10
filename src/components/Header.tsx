import { useInternetIdentity } from '../hooks/useAuth';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, LogOut, Moon, Sun, Settings, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { SettingsDialog } from './SettingsDialog';
import { useState } from 'react';

interface HeaderProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
    const { logout, identity } = useInternetIdentity();
    const { data: userProfile } = useGetCallerUserProfile();
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    const [showSettings, setShowSettings] = useState(false);

    const handleLogout = async () => {
        logout();
        queryClient.clear();
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const navItems = [
        { id: 'overview', label: 'Home' },
        { id: 'library', label: 'Library' },
        { id: 'planner', label: 'Planner' },
        { id: 'quiz', label: 'Quiz' },
        { id: 'flashcards', label: 'Flashcards' },
        { id: 'progress', label: 'Progress' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left">
                                <SheetHeader>
                                    <SheetTitle>Navigation</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-4 mt-6">
                                    {navItems.map((item) => (
                                        <SheetClose asChild key={item.id}>
                                            <button
                                                onClick={() => {
                                                    setActiveTab(item.id);
                                                }}
                                                className={`text-left text-sm font-medium transition-colors hover:text-primary ${activeTab === item.id
                                                    ? 'text-primary font-semibold'
                                                    : 'text-muted-foreground'
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                        </SheetClose>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('overview')}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <span className="text-xl font-bold hidden md:inline-block">AI Companion</span>
                    </div>
                </div>


                <nav className="hidden md:flex items-center gap-6">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`text-sm font-medium transition-colors hover:text-primary ${activeTab === item.id
                                ? 'text-primary font-semibold'
                                : 'text-muted-foreground'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar>
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {userProfile?.name ? getInitials(userProfile.name) : '?'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="flex items-center justify-start gap-2 p-2">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{userProfile?.name || 'Study User'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        Local Account
                                    </p>
                                </div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowSettings(true)}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
                </div>
            </div>
        </header>
    );
}
