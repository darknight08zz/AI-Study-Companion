import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Coffee, Brain, Wind } from 'lucide-react';
import { toast } from 'sonner';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const TIMER_MODES = {
    focus: { label: 'Focus', time: 25 * 60, color: 'text-primary' },
    shortBreak: { label: 'Short Break', time: 5 * 60, color: 'text-green-500' },
    longBreak: { label: 'Long Break', time: 15 * 60, color: 'text-blue-500' },
};

const WELLNESS_TIPS = [
    "Take a deep breath and relax your shoulders.",
    "Drink some water to stay hydrated.",
    "Look away from the screen for 20 seconds.",
    "Stretch your arms and back.",
    "You are doing great! Keep it up.",
    "A clear mind leads to better learning.",
    "Focus on progress, not perfection."
];

export default function FocusModeTab() {
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(TIMER_MODES.focus.time);
    const [isActive, setIsActive] = useState(false);
    const [wellnessTip, setWellnessTip] = useState(WELLNESS_TIPS[0]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            toast.success("Timer finished! Great job!");

        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    useEffect(() => {
        setWellnessTip(WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)]);
    }, [mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(TIMER_MODES[mode].time);
    };

    const switchMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(TIMER_MODES[newMode].time);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                    <Brain className="h-8 w-8 text-primary" /> Focus Mode
                </h2>
                <p className="text-muted-foreground">Eliminate distractions and boost productivity.</p>
            </div>

            <Card className="border-2">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center space-x-2 mb-6">
                        <Button
                            variant={mode === 'focus' ? "default" : "outline"}
                            onClick={() => switchMode('focus')}
                            className="w-24"
                        >
                            Focus
                        </Button>
                        <Button
                            variant={mode === 'shortBreak' ? "default" : "outline"}
                            onClick={() => switchMode('shortBreak')}
                            className="w-24"
                        >
                            Short Break
                        </Button>
                        <Button
                            variant={mode === 'longBreak' ? "default" : "outline"}
                            onClick={() => switchMode('longBreak')}
                            className="w-24"
                        >
                            Long Break
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className={`text-8xl font-bold tracking-tighter tabular-nums mb-8 ${TIMER_MODES[mode].color} transition-colors duration-500`}>
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex gap-4 mb-8">
                        <Button size="lg" className="h-14 w-14 rounded-full" onClick={toggleTimer}>
                            {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={resetTimer}>
                            <RotateCcw className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3 text-muted-foreground animate-pulse">
                        <Wind className="h-5 w-5" />
                        <p className="text-sm font-medium">"{wellnessTip}"</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Daily Focus</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0m</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Streak</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1 Day</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
