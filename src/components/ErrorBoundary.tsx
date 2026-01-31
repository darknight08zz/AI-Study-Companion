import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                    <p className="text-muted-foreground max-w-[500px]">
                        {this.state.error?.message || "An unexpected error occurred while rendering this component."}
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                        <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
