import { useState, useEffect } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetup() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.user_metadata?.name || user?.user_metadata?.full_name || '');
    const saveProfile = useSaveCallerUserProfile();

    // Effect to update name if user loads later (edge case)
    useEffect(() => {
        if (!name && user?.user_metadata) {
            setName(user.user_metadata.name || user.user_metadata.full_name || '');
        }
    }, [user, name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        try {
            await saveProfile.mutateAsync({
                name: name.trim(),
                email: user?.email, // Save email from auth user
                xp: 0,
                level: 1,
                dailyStreak: 0,
                lastActivityDate: Date.now()
            });
            toast.success('Profile created successfully!');
        } catch (error) {
            toast.error('Failed to create profile');
            console.error(error);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                        <BookOpen className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Welcome to AI Study Companion</CardTitle>
                    <CardDescription>Let's set up your profile to get started</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={saveProfile.isPending}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
                            {saveProfile.isPending ? 'Creating Profile...' : 'Continue'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
