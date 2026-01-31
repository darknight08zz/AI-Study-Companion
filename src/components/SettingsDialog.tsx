
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '@/hooks/useQueries';
import { supabase } from '@/services/supabaseClient';
import { toast } from 'sonner';

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const { data: userProfile } = useGetCallerUserProfile();
    const saveProfileMutation = useSaveCallerUserProfile();

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [aiPersona, setAiPersona] = useState('friendly');

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Initialize state when profile loads or dialog opens
    useEffect(() => {
        if (userProfile && open) {
            setDisplayName(userProfile.name || '');
            setAiPersona(userProfile.aiPersona || 'friendly');
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [userProfile, open]);

    const handleSaveProfile = async () => {
        if (!userProfile) return;

        try {
            await saveProfileMutation.mutateAsync({
                ...userProfile,
                name: displayName,
                aiPersona: aiPersona
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
            console.error(error);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success("Password updated successfully");
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error("Failed to update password: " + error.message);
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account settings and preferences.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input
                                id="name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>
                        <Button onClick={handleSaveProfile} disabled={saveProfileMutation.isPending}>
                            {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>AI Persona</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: 'friendly', name: 'Friendly Helper', desc: 'Encouraging and supportive' },
                                    { id: 'strict', name: 'Strict Tutor', desc: 'Direct and disciplined' },
                                    { id: 'concise', name: 'Concise Expert', desc: 'To the point and technical' },
                                    { id: 'socratic', name: 'Socratic Guide', desc: 'Asks questions to lead you' }
                                ].map((persona) => (
                                    <div
                                        key={persona.id}
                                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all hover:bg-accent ${aiPersona === persona.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                                            }`}
                                        onClick={() => setAiPersona(persona.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{persona.name}</span>
                                            <span className="text-xs text-muted-foreground">{persona.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleSaveProfile} disabled={saveProfileMutation.isPending}>
                            {saveProfileMutation.isPending ? "Saving..." : "Save Preferences"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="account" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm New Password"
                            />
                        </div>
                        <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                            {isUpdatingPassword ? "Updating..." : "Update Password"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
