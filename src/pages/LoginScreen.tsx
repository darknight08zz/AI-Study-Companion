import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Mail } from 'lucide-react';

interface LoginScreenProps {
    initialSignUp?: boolean;
    onBack?: () => void;
}

export default function LoginScreen({ initialSignUp = false, onBack }: LoginScreenProps) {
    const { login } = useInternetIdentity();
    const [isRightPanelActive, setIsRightPanelActive] = useState(initialSignUp);

    // Form states
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        // Pass isSignUp=true and the name
        login(email, password, true, name);
    };

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        // Pass isSignUp=false
        login(email, password, false);
    };

    return (
        <div className="flex justify-center items-center flex-col h-screen bg-[#f6f5f7] dark:bg-background font-sans relative">
            {onBack && (
                <Button
                    variant="ghost"
                    className="absolute top-4 left-4 z-50 hover:bg-transparent hover:text-primary"
                    onClick={onBack}
                >
                    ← Back to Home
                </Button>
            )}
            <div className={`login-container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
                {/* Sign Up Container */}
                <div className="form-container sign-up-container bg-background">
                    <form className="bg-background flex flex-col items-center justify-center px-12 text-center h-full" onSubmit={handleSignUp}>
                        <h1 className="font-bold text-3xl mb-0 dark:text-foreground">Create Account</h1>
                        <div className="social-container">
                            <a href="#" className="social text-foreground hover:bg-muted"><Github className="h-5 w-5" /></a>
                            <a href="#" className="social text-foreground hover:bg-muted"><Mail className="h-5 w-5" /></a>
                            <a href="#" className="social text-foreground hover:bg-muted"><Linkedin className="h-5 w-5" /></a>
                        </div>
                        <span className="text-xs text-muted-foreground mb-4">or use your email for registration</span>
                        <input
                            type="text"
                            placeholder="Name"
                            className="bg-muted border-none p-3 my-2 w-full rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="bg-muted border-none p-3 my-2 w-full rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="bg-muted border-none p-3 my-2 w-full rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button className="mt-4 rounded-full px-12 py-3 font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-primary/50 transition-all">
                            Sign Up

                        </Button>
                    </form>
                </div>

                {/* Sign In Container */}
                <div className="form-container sign-in-container bg-background">
                    <form className="bg-background flex flex-col items-center justify-center px-12 text-center h-full" onSubmit={handleSignIn}>
                        <h1 className="font-bold text-3xl mb-0 dark:text-foreground">Sign in</h1>
                        <div className="social-container">
                            <a href="#" className="social text-foreground hover:bg-muted"><Github className="h-5 w-5" /></a>
                            <a href="#" className="social text-foreground hover:bg-muted"><Mail className="h-5 w-5" /></a>
                            <a href="#" className="social text-foreground hover:bg-muted"><Linkedin className="h-5 w-5" /></a>
                        </div>
                        <span className="text-xs text-muted-foreground mb-4">or use your account</span>
                        <input
                            type="email"
                            placeholder="Email"
                            className="bg-muted border-none p-3 my-2 w-full rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="bg-muted border-none p-3 my-2 w-full rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <a href="#" className="text-foreground text-sm my-4 hover:underline">Forgot your password?</a>
                        <Button className="mt-2 rounded-full px-12 py-3 font-bold uppercase tracking-wider text-xs shadow-lg hover:shadow-primary/50 transition-all">
                            Sign In
                        </Button>
                    </form>
                </div>

                {/* Overlay Container */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1 className="font-bold text-3xl mb-4 text-white">Welcome Back!</h1>
                            <p className="text-sm font-light leading-relaxed mb-8 text-white/90">
                                To keep connected with us please login with your personal info
                            </p>
                            <button
                                className="bg-transparent border border-white text-white rounded-full px-12 py-3 font-bold uppercase tracking-wider text-xs transform active:scale-95 focus:outline-none transition-transform"
                                onClick={() => setIsRightPanelActive(false)}
                            >
                                Sign In
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1 className="font-bold text-3xl mb-4 text-white">Hello, Friend!</h1>
                            <p className="text-sm font-light leading-relaxed mb-8 text-white/90">
                                Enter your personal details and start your journey with us
                            </p>
                            <button
                                className="bg-transparent border border-white text-white rounded-full px-12 py-3 font-bold uppercase tracking-wider text-xs transform active:scale-95 focus:outline-none transition-transform"
                                onClick={() => setIsRightPanelActive(true)}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-12 text-center text-sm text-muted-foreground">
                <p>
                    AI Study Companion &copy; {new Date().getFullYear()}
                </p>
            </footer>
        </div>
    );
}
