import { useState, ReactNode } from 'react';
import { useGetAllTasksSortedByDueDate, useDeleteTask, useUpdateTask, useAddXp } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, Timer, Play, Pause, Square, ExternalLink, CalendarPlus } from 'lucide-react';
import { TaskStatus, TaskStatusEnum, type StudyTask } from '../../services/localStorage';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { generateICS } from '../../utils/calendar';
import TaskDialog from '../TaskDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PlannerTab() {
    const { data: tasks = [], isLoading } = useGetAllTasksSortedByDueDate();
    const deleteTask = useDeleteTask();
    const updateTask = useUpdateTask();
    const addXp = useAddXp();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const [focusTask, setFocusTask] = useState<StudyTask | null>(null);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isTimerRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isTimerRunning) {
            handleTimerComplete();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning, timeLeft]);

    const handleStartFocus = (task: StudyTask) => {
        setFocusTask(task);
        setTimeLeft(25 * 60);
        setIsTimerRunning(true);
        toast.success(`Focus session started for "${task.title}"`);
    };

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimerComplete = async () => {
        setIsTimerRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const { newLevel, leveledUp } = await addXp.mutateAsync(50);
            toast.success("Focus session completed! You gained 50 XP.");
            if (leveledUp) {
                toast.success(`🎉 Level Up! You are now level ${newLevel}!`);
            }
        } catch (e) {
            console.error(e);
        }

        setFocusTask(null);
    };

    const cancelFocus = () => {
        setIsTimerRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setFocusTask(null);
        toast.info("Focus session cancelled");
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTask.mutateAsync(id);
            toast.success('Task deleted successfully');
            setDeletingTaskId(null);
        } catch (error) {
            toast.error('Failed to delete task');
            console.error(error);
        }
    };

    const handleStatusChange = async (task: StudyTask, newStatus: TaskStatus) => {
        try {
            await updateTask.mutateAsync({
                id: task.id,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate,
                subjectTags: task.subjectTags,
                status: newStatus,
            });
            toast.success('Task status updated');
        } catch (error) {
            toast.error('Failed to update task status');
            console.error(error);
        }
    };

    const getStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case TaskStatusEnum.completed:
                return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Completed</Badge>;
            case TaskStatusEnum.inProgress:
                return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">In Progress</Badge>;
            case TaskStatusEnum.notStarted:
                return <Badge variant="outline">Not Started</Badge>;
        }
    };

    const filteredTasks = tasks.filter((task) => {
        if (statusFilter === 'all') return true;
        return task.status === statusFilter;
    });

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Study Planner</h2>
                    <p className="text-muted-foreground">Manage your tasks and study schedule</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>


            {focusTask && (
                <Card className="bg-primary/5 border-primary/20 border-l-4 border-l-primary animate-in slide-in-from-top">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                                <Timer className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg">{focusTask.title}</h4>
                                <p className="text-sm text-muted-foreground">Focusing...</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-3xl font-mono font-bold tracking-wider">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={toggleTimer}>
                                    {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <Button variant="destructive" size="icon" onClick={cancelFocus}>
                                    <Square className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value={TaskStatusEnum.notStarted}>Not Started</SelectItem>
                        <SelectItem value={TaskStatusEnum.inProgress}>In Progress</SelectItem>
                        <SelectItem value={TaskStatusEnum.completed}>Completed</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md p-1 bg-muted">
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-8"
                    >
                        List
                    </Button>
                    <Button
                        variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('calendar')}
                        className="h-8"
                    >
                        Calendar
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No tasks found</h3>
                        <p className="text-center text-muted-foreground mb-4">
                            You don't have any tasks matching your criteria.
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>Create your first task</Button>
                    </CardContent>
                </Card>
            ) : viewMode === 'list' ? (
                <div className="grid gap-4">
                    {filteredTasks.map((task) => (
                        <Card key={task.id} className="transition-all hover:shadow-md">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            {task.title}
                                            {getStatusBadge(task.status)}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            Due: {formatDate(task.dueDate)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => setEditingTask(task)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {!focusTask && task.status !== TaskStatusEnum.completed && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleStartFocus(task)}
                                                title="Start Focus Session"
                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                <Timer className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                generateICS(task);
                                                toast.success("Calendar event downloaded!");
                                            }}
                                            title="Add to Calendar"
                                            className="text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                        >
                                            <CalendarPlus className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setDeletingTaskId(task.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {task.subjectTags.map((tag, index) => (
                                        <Badge key={index} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Status:</span>
                                    <Select
                                        value={task.status}
                                        onValueChange={(value) => handleStatusChange(task, value as TaskStatus)}
                                    >
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={TaskStatusEnum.notStarted}>Not Started</SelectItem>
                                            <SelectItem value={TaskStatusEnum.inProgress}>In Progress</SelectItem>
                                            <SelectItem value={TaskStatusEnum.completed}>Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-6">
                    <Card className="md:w-auto flex-shrink-0 h-fit">
                        <CardContent className="p-4">
                            <div className="w-full">

                                <div className="text-center font-semibold mb-4">
                                    {selectedDate?.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-muted-foreground">{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center">

                                    {(() => {
                                        const now = selectedDate || new Date();
                                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                                        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                        const startDay = startOfMonth.getDay();
                                        const daysInMonth = endOfMonth.getDate();

                                        const days: ReactNode[] = [];
                                        for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} />);
                                        for (let i = 1; i <= daysInMonth; i++) {
                                            const current = new Date(now.getFullYear(), now.getMonth(), i);
                                            const hasTask = tasks.some(t => {
                                                const d = new Date(Number(t.dueDate) / 1000000);
                                                return d.getDate() === i && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                            });

                                            days.push(
                                                <Button
                                                    key={i}
                                                    variant={current.getDate() === now.getDate() ? "default" : "ghost"}
                                                    className={`h-8 w-8 p-0 ${hasTask ? "font-bold text-primary" : ""}`}
                                                    onClick={() => setSelectedDate(current)}
                                                >
                                                    {i}
                                                    {hasTask && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current opacity-50" />}
                                                </Button>
                                            );
                                        }
                                        return days;
                                    })()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex-1 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Tasks for {selectedDate?.toLocaleDateString()}
                        </h3>
                        {(() => {
                            const dateTasks = tasks.filter(t => {
                                const d = new Date(t.dueDate);
                                return selectedDate &&
                                    d.getDate() === selectedDate.getDate() &&
                                    d.getMonth() === selectedDate.getMonth() &&
                                    d.getFullYear() === selectedDate.getFullYear();
                            });

                            if (dateTasks.length === 0) {
                                return <p className="text-muted-foreground">No tasks scheduled for this day.</p>;
                            }

                            return dateTasks.map(task => (
                                <Card key={task.id}>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base flex items-center justify-between">
                                            {task.title}
                                            {getStatusBadge(task.status)}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="py-3 pt-0">
                                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                        <div className="flex gap-2 text-xs">
                                            {task.subjectTags.map(tag => <Badge key={tag} variant="secondary" className="px-1 py-0">{tag}</Badge>)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ));
                        })()}
                    </div>
                </div>
            )}

            <TaskDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                mode="create"
            />

            {editingTask && (
                <TaskDialog
                    open={!!editingTask}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                    mode="edit"
                    task={editingTask}
                />
            )}

            <AlertDialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingTaskId && handleDelete(deletingTaskId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
