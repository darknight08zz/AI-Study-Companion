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


    const getStudyInsights = (): Insight[] => {
        const insights: Insight[] = [];


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


    const getSmartRecommendations = (): Recommendation[] => {
        const recommendations: Recommendation[] = [];


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

                <div className="flex items-center justify-between pb-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
                        <p className="text-muted-foreground">Welcome back to your study space</p>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">


                    <div className="md:col-span-8 grid gap-6">

                        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Sparkles className="w-40 h-40 text-primary" />
                            </div>
                            <CardHeader className="relative z-10">
                                <CardTitle className="text-2xl">Ready to learn?</CardTitle>
                                <CardDescription className="text-base">
                                    You have <span className="font-semibold text-foreground">{inProgressTasks} active tasks</span> and <span className="font-semibold text-foreground">{notStartedTasks} pending</span>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10 flex flex-wrap gap-4">
                                <Button onClick={() => onNavigate?.('planner')} className="gap-2 shadow-md hover:shadow-lg transition-all">
                                    <PlusCircle className="h-4 w-4" />
                                    New Task
                                </Button>
                                <Button variant="secondary" onClick={() => onNavigate?.('quiz')} className="gap-2 bg-background/50 hover:bg-background/80">
                                    <PlayCircle className="h-4 w-4" />
                                    Take Quiz
                                </Button>
                                <Button variant="outline" onClick={() => onNavigate?.('library')} className="gap-2 bg-transparent">
                                    <FileText className="h-4 w-4" />
                                    Library
                                </Button>
                            </CardContent>
                        </Card>


                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <Card className="hover:bg-accent/50 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalTasks}</div>
                                    <p className="text-xs text-muted-foreground">{completedTasks} completed</p>
                                </CardContent>
                            </Card>
                            <Card className="hover:bg-accent/50 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{averageScore.toFixed(0)}%</div>
                                    <p className="text-xs text-muted-foreground">{totalQuizzes} quizzes</p>
                                </CardContent>
                            </Card>
                            <Card className="md:col-span-1 col-span-2 hover:bg-accent/50 transition-colors">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                                    <Clock className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{inProgressTasks}</div>
                                    <p className="text-xs text-muted-foreground">Focus mode</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>


                    <Card className="md:col-span-4 flex flex-col justify-center items-center p-6 bg-card/50 backdrop-blur-sm border-border/60">
                        <div className="relative flex items-center justify-center w-40 h-40">
                            {/* Simple CSS-only Circular Progress placeholder - Recharts PieChart would be better but keeping it simple/robust for now */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    className="text-muted/20"
                                    strokeWidth="10"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                                <circle
                                    className="text-primary transition-all duration-1000 ease-out"
                                    strokeWidth="10"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * completionRate) / 100}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="70"
                                    cx="80"
                                    cy="80"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-bold">{completionRate.toFixed(0)}%</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Complete</span>
                            </div>
                        </div>
                        <div className="mt-6 w-full space-y-2">
                            {insights.slice(0, 2).map((insight, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                                    <insight.icon className={`h-4 w-4 shrink-0 ${insight.type === 'positive' ? 'text-green-500' : 'text-primary'}`} />
                                    <span>{insight.message}</span>
                                </div>
                            ))}
                        </div>
                    </Card>


                    <Card className="md:col-span-7 h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Upcoming Tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {upcomingTasks.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">No upcoming tasks</div>
                                ) : (
                                    upcomingTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-10 rounded-full ${task.status === TaskStatusEnum.inProgress ? 'bg-primary' : 'bg-muted'}`} />
                                                <div>
                                                    <p className="font-medium">{task.title}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        {task.subjectTags.slice(0, 2).map(tag => (
                                                            <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-5">{tag}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground">
                                                {new Date(Number(task.dueDate) / 1000000).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-5 h-full relative overflow-hidden bg-gradient-to-tr from-accent/5 to-transparent">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Smart Suggestions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recommendations.slice(0, 3).map((rec, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-background/80 border shadow-sm text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-foreground">{rec.title}</span>
                                            <Badge variant={rec.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px] h-5">{rec.priority}</Badge>
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">{rec.description}</p>
                                        <Button variant="link" className="p-0 h-auto text-xs mt-2 text-primary" onClick={() => onNavigate?.('planner')}>
                                            {rec.action} -&gt;
                                        </Button>
                                    </div>
                                ))}
                                {recommendations.length === 0 && (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                        No recommendations right now. Keep studying!
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TooltipProvider>
    );
}


