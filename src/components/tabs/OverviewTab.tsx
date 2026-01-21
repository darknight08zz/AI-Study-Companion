import { useGetAllTasks, useGetQuizResultsForCaller } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TaskStatus, TaskStatusEnum } from '../../services/localStorage';
import { Calendar, CheckCircle2, Clock, Trophy, Lightbulb, Target, TrendingUp, Sparkles, ListTodo } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LucideIcon } from 'lucide-react';

interface Insight {
    type: 'positive' | 'warning' | 'info';
    icon: LucideIcon;
    message: string;
}

interface Recommendation {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    subjects: string[];
}

import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, PlayCircle } from 'lucide-react';

interface OverviewTabProps {
    onNavigate?: (tab: string) => void;
}

export default function OverviewTab({ onNavigate }: OverviewTabProps) {
    const { data: tasks = [], isLoading: tasksLoading } = useGetAllTasks();
    const { data: quizResults = [], isLoading: quizLoading } = useGetQuizResultsForCaller();

    const completedTasks = tasks.filter((t) => t.status === TaskStatusEnum.completed).length;
    const inProgressTasks = tasks.filter((t) => t.status === TaskStatusEnum.inProgress).length;
    const notStartedTasks = tasks.filter((t) => t.status === TaskStatusEnum.notStarted).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalQuizzes = quizResults.length;
    const averageScore =
        totalQuizzes > 0
            ? quizResults.reduce((acc, r) => acc + (Number(r.score) / Number(r.totalQuestions)) * 100, 0) /
            totalQuizzes
            : 0;

    const upcomingTasks = tasks
        .filter((t) => t.status !== TaskStatusEnum.completed)
        .sort((a, b) => Number(a.dueDate - b.dueDate))
        .slice(0, 3);

    // AI-based study insights
    const getStudyInsights = (): Insight[] => {
        const insights: Insight[] = [];

        // Quiz performance insights
        if (totalQuizzes >= 3) {
            const recentQuizzes = quizResults.slice(-3);
            const recentAvg = recentQuizzes.reduce((acc, r) => acc + (Number(r.score) / Number(r.totalQuestions)) * 100, 0) / recentQuizzes.length;

            if (recentAvg > averageScore) {
                insights.push({
                    type: 'positive',
                    icon: TrendingUp,
                    message: `Great progress! Your recent quiz scores (${recentAvg.toFixed(0)}%) are above your average. Keep up the momentum!`,
                });
            } else if (recentAvg < averageScore - 10) {
                insights.push({
                    type: 'warning',
                    icon: Target,
                    message: 'Your recent quiz scores have dipped. Consider reviewing the material and taking a break if needed.',
                });
            }
        }

        // Task completion insights
        if (inProgressTasks > 3) {
            insights.push({
                type: 'info',
                icon: Lightbulb,
                message: `You have ${inProgressTasks} tasks in progress. Focus on completing 1-2 before starting new ones.`,
            });
        }

        if (notStartedTasks > 0 && completedTasks > 0) {
            insights.push({
                type: 'info',
                icon: Sparkles,
                message: `You've completed ${completedTasks} tasks! Start one of your ${notStartedTasks} pending tasks to maintain your streak.`,
            });
        }

        // Motivational insights
        if (completionRate >= 80) {
            insights.push({
                type: 'positive',
                icon: Trophy,
                message: `Outstanding! You've completed ${completionRate.toFixed(0)}% of your tasks. You're a study champion!`,
            });
        }

        if (totalQuizzes === 0 && totalTasks > 0) {
            insights.push({
                type: 'info',
                icon: Lightbulb,
                message: 'Take a quiz to test your knowledge and track your progress over time.',
            });
        }

        return insights;
    };

    // Smart study recommendations
    const getSmartRecommendations = (): Recommendation[] => {
        const recommendations: Recommendation[] = [];

        // Priority recommendations based on incomplete tasks
        const incompleteTasks = tasks.filter(t => t.status !== TaskStatusEnum.completed);
        const overdueTasks = incompleteTasks.filter(t => Number(t.dueDate) < Date.now() * 1000000);

        if (overdueTasks.length > 0) {
            recommendations.push({
                priority: 'high',
                title: 'Overdue Tasks Need Attention',
                description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Focus on these first.`,
                action: 'View Planner',
                subjects: overdueTasks[0]?.subjectTags || [],
            });
        }

        // Recommend based on quiz performance
        if (totalQuizzes >= 2) {
            const lastQuizScore = (Number(quizResults[0].score) / Number(quizResults[0].totalQuestions)) * 100;
            if (lastQuizScore < 70) {
                recommendations.push({
                    priority: 'medium',
                    title: 'Review Recommended',
                    description: `Your last quiz score was ${lastQuizScore.toFixed(0)}%. Consider reviewing the material before the next quiz.`,
                    action: 'Take Quiz',
                    subjects: [],
                });
            }
        }

        // Recommend starting new tasks
        if (notStartedTasks > 0 && inProgressTasks === 0) {
            const nextTask = tasks.find(t => t.status === TaskStatusEnum.notStarted);
            if (nextTask) {
                recommendations.push({
                    priority: 'medium',
                    title: 'Start Your Next Task',
                    description: `Begin working on "${nextTask.title}" to maintain your study momentum.`,
                    action: 'View Task',
                    subjects: nextTask.subjectTags,
                });
            }
        }

        // Encourage quiz taking
        if (totalQuizzes === 0 || (totalTasks > 0 && totalQuizzes < totalTasks / 2)) {
            recommendations.push({
                priority: 'low',
                title: 'Test Your Knowledge',
                description: 'Regular quizzes help reinforce learning and identify areas for improvement.',
                action: 'Take Quiz',
                subjects: [],
            });
        }

        return recommendations;
    };

    const insights = getStudyInsights();
    const recommendations = getSmartRecommendations();

    if (tasksLoading || quizLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
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

    return (
        <TooltipProvider>
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome back!</h2>
                        <p className="text-muted-foreground mt-2 text-lg">Here's an overview of your study progress</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => onNavigate?.('planner')} className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full px-6">
                            <PlusCircle className="h-4 w-4" />
                            New Task
                        </Button>
                        <Button variant="outline" onClick={() => onNavigate?.('quiz')} className="gap-2 rounded-full px-6 border-primary/20 hover:bg-primary/5">
                            <PlayCircle className="h-4 w-4" />
                            Start Quiz
                        </Button>
                        <Button variant="outline" onClick={() => onNavigate?.('library')} className="gap-2 rounded-full px-6 border-primary/20 hover:bg-primary/5">
                            <FileText className="h-4 w-4" />
                            Add Materials
                        </Button>
                    </div>
                </div>

                {/* AI Study Insights */}
                {insights.length > 0 && (
                    <div className="space-y-3">
                        {insights.map((insight, index) => {
                            const Icon = insight.icon;
                            return (
                                <Alert
                                    key={index}
                                    className={`animate-in slide-in-from-left duration-500 border-l-4 ${insight.type === 'positive'
                                        ? 'border-l-green-500 bg-green-500/5'
                                        : insight.type === 'warning'
                                            ? 'border-l-yellow-500 bg-yellow-500/5'
                                            : 'border-l-primary bg-primary/5'
                                        }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <Icon className="h-4 w-4" />
                                    <AlertDescription className="ml-2">{insight.message}</AlertDescription>
                                </Alert>
                            );
                        })}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-primary/10 bg-gradient-to-br from-card to-card/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
                                    <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                                        <ListTodo className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{totalTasks}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{completedTasks} completed</p>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Total number of study tasks you've created</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-primary/10 bg-gradient-to-br from-card to-card/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                                    <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{completionRate.toFixed(0)}%</div>
                                    <Progress value={completionRate} className="mt-2 h-1.5" />
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Percentage of tasks you've completed</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-primary/10 bg-gradient-to-br from-card to-card/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Quizzes Taken</CardTitle>
                                    <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500">
                                        <Trophy className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{totalQuizzes}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Avg: {averageScore.toFixed(0)}%</p>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Total quizzes completed and your average score</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-primary/10 bg-gradient-to-br from-card to-card/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                                    <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{inProgressTasks}</div>
                                    <p className="text-xs text-muted-foreground mt-1">{notStartedTasks} not started</p>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Tasks currently in progress and pending tasks</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Smart Study Recommendations */}
                {recommendations.length > 0 && (
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Smart Study Recommendations
                            </CardTitle>
                            <CardDescription>AI-powered suggestions based on your progress</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md animate-in slide-in-from-bottom duration-500"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div
                                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${rec.priority === 'high'
                                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                : rec.priority === 'medium'
                                                    ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                }`}
                                        >
                                            <Target className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{rec.title}</h4>
                                                <Badge
                                                    variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {rec.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                                            {rec.subjects.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pt-1">
                                                    {rec.subjects.map((subject) => (
                                                        <Badge key={subject} variant="outline" className="text-xs">
                                                            {subject}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Upcoming Tasks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Upcoming Tasks
                        </CardTitle>
                        <CardDescription>Your next tasks to focus on</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingTasks.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No upcoming tasks. Create one to get started!
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingTasks.map((task, index) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50 animate-in slide-in-from-right duration-500"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex-1 space-y-1">
                                            <h4 className="font-semibold">{task.title}</h4>
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {task.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {task.subjectTags.map((tag) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                {new Date(Number(task.dueDate) / 1000000).toLocaleDateString()}
                                            </p>
                                            <Badge
                                                variant={
                                                    task.status === TaskStatusEnum.inProgress ? 'default' : 'outline'
                                                }
                                                className="mt-1"
                                            >
                                                {task.status === TaskStatusEnum.inProgress ? 'In Progress' : 'Not Started'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}


