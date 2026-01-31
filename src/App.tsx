import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useInternetIdentity } from './hooks/useAuth';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginScreen from './pages/LoginScreen';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

export default function App() {
    const { identity, isInitializing } = useInternetIdentity();
    const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

    // State for managing landing page vs login screen
    const [showLoginScreen, setShowLoginScreen] = useState(false);
    const [initialSignUp, setInitialSignUp] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const isAuthenticated = !!identity;
    const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

    if (isInitializing) {
        return (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <div className="text-center">
                        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    if (!isAuthenticated) {
        return (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                {showLoginScreen ? (
                    <LoginScreen
                        initialSignUp={initialSignUp}
                        onBack={() => setShowLoginScreen(false)}
                    />
                ) : (
                    <LandingPage
                        onLoginClick={() => {
                            setInitialSignUp(false);
                            setShowLoginScreen(true);
                        }}
                        onSignUpClick={() => {
                            setInitialSignUp(true);
                            setShowLoginScreen(true);
                        }}
                    />
                )}
                <Toaster />
            </ThemeProvider>
        );
    }

    if (showProfileSetup) {
        return (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="min-h-screen bg-background">
                    <ProfileSetup />
                </div>
                <Toaster />
            </ThemeProvider>
        );
    }



    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ErrorBoundary>
                <div className="flex min-h-screen flex-col bg-background">
                    <Header activeTab={activeTab} setActiveTab={setActiveTab} />
                    <main className="flex-1">
                        <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
                    </main>
                    <Footer />
                </div>
                <Toaster />
            </ErrorBoundary>
        </ThemeProvider>
    );
}
