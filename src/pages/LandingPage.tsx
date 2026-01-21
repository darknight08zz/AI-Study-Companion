import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Database, Zap, ArrowRight, Brain, Layers, TrendingUp } from 'lucide-react';

interface LandingPageProps {
    onLoginClick: () => void;
    onSignUpClick: () => void;
}

export default function LandingPage({ onLoginClick, onSignUpClick }: LandingPageProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg hidden sm:inline-block">AI Study Companion</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={onLoginClick}>Sign In</Button>
                        <Button onClick={onSignUpClick}>Sign Up</Button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <Badge variant="outline" className="animate-in fade-in zoom-in duration-500 rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary">
                            <span className="mr-2 rounded-full bg-primary w-2 h-2 inline-block animate-pulse"></span>
                            Now with AI-Powered Insights
                        </Badge>
                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent animate-in slide-in-from-bottom duration-700">
                            Master Your Studies <br />
                            Without Distractions
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 animate-in slide-in-from-bottom duration-700 delay-100">
                            A private, self-hosted study companion that helps you organize tasks,
                            track progress, and test your knowledge with AI-generated quizzes.
                        </p>
                        <div className="space-x-4 animate-in slide-in-from-bottom duration-700 delay-200">
                            <Button size="lg" onClick={onSignUpClick} className="gap-2 h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full">
                                Get Started <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button size="lg" variant="outline" onClick={onLoginClick} className="h-12 px-8 text-base rounded-full">
                                Existing User
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="container space-y-6 bg-slate-50 dark:bg-transparent py-8 md:py-12 lg:py-24">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                            Features
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Everything you need to stay focused and efficient in your academic journey.
                        </p>
                    </div>
                    <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                        <FeatureCard
                            icon={CheckCircle2}
                            title="Smart Planning"
                            description="Organize tasks with intelligent tagging, scheduling, and priority management."
                        />
                        <FeatureCard
                            icon={Brain}
                            title="AI Quizzes"
                            description="Test your knowledge with auto-generated quizzes based on your study materials."
                        />
                        <FeatureCard
                            icon={Database}
                            title="Private Data"
                            description="Your study data is yours. We prioritize privacy and local-first data handling."
                        />
                        <FeatureCard
                            icon={Layers}
                            title="Flashcards"
                            description="Create and review flashcards with spaced repetition to master complex topics."
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Progress Tracking"
                            description="Visualize your study habits and improvements with detailed analytics."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Focus Mode"
                            description="Eliminate distractions with a dedicated focus mode for deep work sessions."
                        />
                    </div>
                </section>
            </main>

            <footer className="py-6 md:px-8 md:py-0 border-t">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built by your <span className="font-semibold text-foreground">AI Study Companion</span> team.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="relative overflow-hidden rounded-lg border bg-background p-2 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Icon className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    );
}
