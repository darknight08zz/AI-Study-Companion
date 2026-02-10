import { useGetQuizResultsForCaller, useGetAllTasks, useGetCallerUserProfile } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatusEnum, type TaskStatus } from '../../services/localStorage';
import { TrendingUp, Award, Target, Calendar, Flame, Star, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Milestone {
    title: string;
    icon: string;
    achieved: boolean;
}

export default function ProgressTab() {
    const { data: quizResults = [], isLoading: quizLoading } = useGetQuizResultsForCaller();
    const { data: tasks = [], isLoading: tasksLoading } = useGetAllTasks();
    const { data: userProfile } = useGetCallerUserProfile();

    if (quizLoading || tasksLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const totalQuizzes = quizResults.length;
    const averageScore =
        totalQuizzes > 0
            ? quizResults.reduce((acc, r) => acc + (Number(r.score) / Number(r.totalQuestions)) * 100, 0) /
            totalQuizzes
            : 0;

    const completedTasks = tasks.filter((t) => t.status === TaskStatusEnum.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const calculateStreak = () => {
        if (quizResults.length === 0 && completedTasks === 0) return 0;

        const allActivities = [
            ...quizResults.map(q => Number(q.timestamp) / 1000000),
            ...tasks.filter(t => t.status === TaskStatusEnum.completed).map(t => Number(t.dueDate) / 1000000)
        ].sort((a, b) => b - a);

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const timestamp of allActivities) {
            const activityDate = new Date(timestamp);
            activityDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak) {
                streak++;
            } else if (daysDiff > streak) {
                break;
            }
        }

        return streak;
    };

    const studyStreak = calculateStreak();

    const quizTrendData = quizResults
        .map((result) => ({
            date: new Date(Number(result.timestamp) / 1000000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            timestamp: Number(result.timestamp),
            score: (Number(result.score) / Number(result.totalQuestions)) * 100,
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-10);

    const calculateImprovement = () => {
        if (quizTrendData.length < 2) return 0;
        const firstHalf = quizTrendData.slice(0, Math.floor(quizTrendData.length / 2));
        const secondHalf = quizTrendData.slice(Math.floor(quizTrendData.length / 2));

        const firstAvg = firstHalf.reduce((acc, d) => acc + d.score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((acc, d) => acc + d.score, 0) / secondHalf.length;

        return secondAvg - firstAvg;
    };

    const improvement = calculateImprovement();

    const getDailyWeeklyData = () => {
        const now = Date.now();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            return {
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date.toLocaleDateString(),
                quizzes: 0,
                tasks: 0,
            };
        }).reverse();

        quizResults.forEach((result) => {
            const resultDate = new Date(Number(result.timestamp) / 1000000).toLocaleDateString();
            const dayData = last7Days.find(d => d.date === resultDate);
            if (dayData) dayData.quizzes++;
        });

        tasks.filter(t => t.status === TaskStatusEnum.completed).forEach((task) => {
            const taskDate = new Date(Number(task.dueDate) / 1000000).toLocaleDateString();
            const dayData = last7Days.find(d => d.date === taskDate);
            if (dayData) dayData.tasks++;
        });

        return last7Days;
    };

    const weeklyData = getDailyWeeklyData();

    const getSubjectBreakdown = () => {
        const subjectMap = new Map<string, number>();

        tasks.forEach(task => {
            task.subjectTags.forEach(tag => {
                subjectMap.set(tag, (subjectMap.get(tag) || 0) + 1);
            });
        });

        return Array.from(subjectMap.entries())
            .map(([subject, count]) => ({ subject, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    const subjectData = getSubjectBreakdown();

    const getMilestones = (): Milestone[] => {
        const milestones: Milestone[] = [];

        if (totalQuizzes >= 1) milestones.push({ title: 'First Quiz', icon: '🎯', achieved: true });
        if (totalQuizzes >= 5) milestones.push({ title: '5 Quizzes', icon: '🌟', achieved: true });
        if (totalQuizzes >= 10) milestones.push({ title: '10 Quizzes', icon: '🏆', achieved: true });
        if (completedTasks >= 1) milestones.push({ title: 'First Task', icon: '✅', achieved: true });
        if (completedTasks >= 5) milestones.push({ title: '5 Tasks', icon: '💪', achieved: true });
        if (completedTasks >= 10) milestones.push({ title: '10 Tasks', icon: '🎖️', achieved: true });
        if (averageScore >= 80) milestones.push({ title: 'High Achiever', icon: '🌟', achieved: true });
        if (studyStreak >= 3) milestones.push({ title: '3-Day Streak', icon: '🔥', achieved: true });
        if (studyStreak >= 7) milestones.push({ title: '7-Day Streak', icon: '🔥🔥', achieved: true });

        if (totalQuizzes < 5) milestones.push({ title: '5 Quizzes', icon: '🌟', achieved: false });
        if (totalQuizzes < 10) milestones.push({ title: '10 Quizzes', icon: '🏆', achieved: false });
        if (completedTasks < 5) milestones.push({ title: '5 Tasks', icon: '💪', achieved: false });
        if (completedTasks < 10) milestones.push({ title: '10 Tasks', icon: '🎖️', achieved: false });

        return milestones;
    };

    const milestones = getMilestones();

    const chartConfig = {
        score: {
            label: 'Score',
            color: 'oklch(var(--primary))',
        },
        quizzes: {
            label: 'Quizzes',
            color: 'oklch(var(--primary))',
        },
        tasks: {
            label: 'Tasks',
            color: 'oklch(var(--accent))',
        },
        count: {
            label: 'Tasks',
            color: 'oklch(var(--primary))',
        },
    };

    const COLORS = [
        'oklch(var(--chart-1))',
        'oklch(var(--chart-2))',
        'oklch(var(--chart-3))',
        'oklch(var(--chart-4))',
        'oklch(var(--chart-5))',
    ];

    const currentLevel = userProfile?.level || 1;
    const currentXp = Number(userProfile?.xp || 0);
    const xpForNextLevel = 100 * Math.pow(currentLevel, 2);
    const xpProgress = (currentXp / xpForNextLevel) * 100;

    return (
        <TooltipProvider>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Progress Tracker</h2>
                    <p className="text-muted-foreground">Monitor your learning journey and achievements</p>
                </div>


                <Card className="bg-gradient-to-r from-primary/10 to-transparent border-none">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="text-2xl font-bold">Level {currentLevel}</h3>
                                <p className="text-sm text-muted-foreground">{currentXp} / {xpForNextLevel} XP</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-medium text-primary">
                                    {(xpForNextLevel - currentXp)} XP to Level {currentLevel + 1}
                                </span>
                            </div>
                        </div>
                        <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(xpProgress, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>


                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Average Quiz Score</CardTitle>
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground">Across {totalQuizzes} quizzes</p>
                                    {improvement !== 0 && (
                                        <div className={`flex items-center gap-1 text-xs mt-1 ${improvement > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            <TrendingUp className={`h-3 w-3 ${improvement < 0 ? 'rotate-180' : ''}`} />
                                            {Math.abs(improvement).toFixed(1)}% {improvement > 0 ? 'improvement' : 'decline'}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Your average score across all quizzes with trend analysis</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
                                    <p className="text-xs text-muted-foreground">
                                        {completedTasks} of {totalTasks} tasks
                                    </p>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Percentage of tasks you've successfully completed</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                                    <Flame className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        {userProfile?.dailyStreak || 0}
                                        {(userProfile?.dailyStreak || 0) > 0 && <span className="text-orange-500">🔥</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {(userProfile?.dailyStreak || 0) > 0 ? `${userProfile?.dailyStreak} day streak` : 'Start your streak'}
                                    </p>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Consecutive days with study activity (quizzes or completed tasks)</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                                    <Trophy className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {milestones.filter(m => m.achieved).length}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {milestones.length} total milestones
                                    </p>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Milestones you've achieved in your learning journey</p>
                        </TooltipContent>
                    </Tooltip>
                </div>


                {milestones.length > 0 && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-primary" />
                                Achievement Milestones
                            </CardTitle>
                            <CardDescription>Track your learning accomplishments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {milestones.map((milestone, index) => (
                                    <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:scale-105 ${milestone.achieved
                                                    ? 'bg-primary/10 border-primary/30'
                                                    : 'bg-muted/50 border-muted opacity-50'
                                                    }`}
                                            >
                                                <span className="text-3xl mb-2">{milestone.icon}</span>
                                                <span className="text-xs text-center font-medium">{milestone.title}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{milestone.achieved ? 'Achieved!' : 'Keep going to unlock'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}


                {weeklyData.some(d => d.quizzes > 0 || d.tasks > 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Weekly Activity
                            </CardTitle>
                            <CardDescription>Your study activity over the past 7 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="day"
                                            className="text-xs"
                                            tick={{ fill: 'oklch(var(--muted-foreground))' }}
                                        />
                                        <YAxis
                                            className="text-xs"
                                            tick={{ fill: 'oklch(var(--muted-foreground))' }}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="quizzes" fill="oklch(var(--primary))" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="tasks" fill="oklch(var(--accent))" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Quiz Performance Trend */}
                {quizTrendData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Quiz Performance Trend
                            </CardTitle>
                            <CardDescription>Your quiz scores over time with improvement tracking</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={quizTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            dataKey="date"
                                            className="text-xs"
                                            tick={{ fill: 'oklch(var(--muted-foreground))' }}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            className="text-xs"
                                            tick={{ fill: 'oklch(var(--muted-foreground))' }}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="oklch(var(--primary))"
                                            strokeWidth={3}
                                            dot={{ fill: 'oklch(var(--primary))', r: 5 }}
                                            activeDot={{ r: 7 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Subject Breakdown */}
                {subjectData.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Time Spent by Subject</CardTitle>
                                <CardDescription>Distribution of your study tasks across subjects</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {subjectData.map((subject, index) => {
                                        const percentage = (subject.count / totalTasks) * 100;
                                        return (
                                            <div key={subject.subject} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                        <span className="font-medium">{subject.subject}</span>
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {subject.count} task{subject.count > 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: COLORS[index % COLORS.length],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Subject Distribution</CardTitle>
                                <CardDescription>Visual breakdown of your study focus</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={subjectData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ subject, percent }) => `${subject} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="oklch(var(--primary))"
                                                dataKey="count"
                                            >
                                                {subjectData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Recent Activity */}
                {quizResults.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Quiz Activity</CardTitle>
                            <CardDescription>Your latest quiz attempts with detailed feedback</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {quizResults.slice(0, 5).map((result, index) => {
                                    const percentage = (Number(result.score) / Number(result.totalQuestions)) * 100;
                                    return (
                                        <div
                                            key={result.id}
                                            className="flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50 animate-in slide-in-from-bottom duration-500"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium">
                                                    Score: {Number(result.score)} / {Number(result.totalQuestions)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(Number(result.timestamp) / 1000000).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">{percentage.toFixed(0)}%</p>
                                                <Badge
                                                    variant={percentage >= 80 ? 'default' : percentage >= 60 ? 'secondary' : 'outline'}
                                                    className="mt-1"
                                                >
                                                    {percentage >= 80 ? '🎉 Excellent' : percentage >= 60 ? '👍 Good' : '📚 Keep trying'}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {totalQuizzes === 0 && totalTasks === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No Progress Data Yet</h3>
                            <p className="text-center text-muted-foreground">
                                Start creating tasks and taking quizzes to see your progress here
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </TooltipProvider>
    );
}
