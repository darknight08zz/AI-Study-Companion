import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { databaseService } from '../services/database';

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    isInitializing: boolean;
    login: (email: string, password?: string, isSignUp?: boolean, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    isInitializing: true,

    login: async (email: string, password?: string, isSignUp?: boolean, name?: string) => {
        if (!email || !password) {
            alert("Please enter both email and password");
            return;
        }

        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        name: name,
                    }
                }
            });
            if (error) {
                alert("Sign up failed: " + error.message);
            } else {
                // If we have a session/user and a name, try to create the profile immediately
                if (data.user && data.session && name) {
                    try {
                        await databaseService.saveCallerUserProfile({
                            name: name,
                            xp: 0,
                            level: 1,
                            dailyStreak: 0,
                            lastActivityDate: Date.now()
                        });
                    } catch (err) {
                        console.error("Failed to create initial profile:", err);
                    }
                }
                alert("Account created! Please check your email to confirm, then log in.");
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                alert("Login failed: " + error.message);
            }
        }
    },

    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Logout failed:", error.message);
        set({ isAuthenticated: false, user: null });
    },

    checkSession: async () => {
        set({ isInitializing: true });

        // Check active session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            set({ isAuthenticated: true, user: session.user, isInitializing: false });
        } else {
            set({ isAuthenticated: false, user: null, isInitializing: false });
        }

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                set({ isAuthenticated: true, user: session.user, isInitializing: false });
            } else {
                set({ isAuthenticated: false, user: null, isInitializing: false });
            }
        });
    }
}));

// Initialize session check on load
useAuth.getState().checkSession();

// Compatibility hook for existing code using 'identity'
export function useInternetIdentity() {
    const { isAuthenticated, user, login, logout, isInitializing } = useAuth();

    // Adapt Supabase user to the 'identity' shape expected by the UI
    const identity = user ? {
        getPrincipal: () => ({
            toText: () => user.id
        })
    } : null;

    return {
        identity,
        isInitializing,
        login,
        logout,
        reload: () => { },
    };
}
