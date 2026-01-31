import { useState, useEffect } from 'react';
import { useCreateTask, useUpdateTask } from '../hooks/useQueries';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { StudyTask, TaskStatus } from '../services/localStorage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatusEnum } from '../services/localStorage';

interface TaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    task?: StudyTask;
}

export default function TaskDialog({ open, onOpenChange, mode, task }: TaskDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [status, setStatus] = useState<TaskStatus>(TaskStatusEnum.notStarted);

    const createTask = useCreateTask();
    const updateTask = useUpdateTask();

    useEffect(() => {
        if (mode === 'edit' && task) {
            setTitle(task.title);
            setDescription(task.description);
            setDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
            setTags(task.subjectTags);
            setStatus(task.status);
        } else {
            setTitle('');
            setDescription('');
            setDueDate('');
            setTags([]);
            setStatus(TaskStatusEnum.notStarted);
        }
    }, [mode, task, open]);

    const handleAddTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim() || !dueDate) {
            toast.error('Please fill in all required fields');
            return;
        }

        const dueDateMs = new Date(dueDate).getTime();

        try {
            if (mode === 'create') {
                await createTask.mutateAsync({
                    title: title.trim(),
                    description: description.trim(),
                    dueDate: dueDateMs,
                    subjectTags: tags,
                });
                toast.success('Task created successfully');
            } else if (task) {
                await updateTask.mutateAsync({
                    id: task.id,
                    title: title.trim(),
                    description: description.trim(),
                    dueDate: dueDateMs,
                    subjectTags: tags,
                    status,
                });
                toast.success('Task updated successfully');
            }
            onOpenChange(false);
        } catch (error) {
            toast.error(`Failed to ${mode} task`);
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Create New Task' : 'Edit Task'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? 'Add a new study task to your planner'
                            : 'Update your study task details'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Review Chapter 5"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={createTask.isPending || updateTask.isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what you need to study..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={createTask.isPending || updateTask.isPending}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date *</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            disabled={createTask.isPending || updateTask.isPending}
                        />
                    </div>

                    {mode === 'edit' && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TaskStatusEnum.notStarted}>Not Started</SelectItem>
                                    <SelectItem value={TaskStatusEnum.inProgress}>In Progress</SelectItem>
                                    <SelectItem value={TaskStatusEnum.completed}>Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="tags">Subject Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                id="tags"
                                placeholder="e.g., Mathematics"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                disabled={createTask.isPending || updateTask.isPending}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleAddTag}
                                disabled={createTask.isPending || updateTask.isPending}
                            >
                                Add
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createTask.isPending || updateTask.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
                            {createTask.isPending || updateTask.isPending
                                ? mode === 'create'
                                    ? 'Creating...'
                                    : 'Updating...'
                                : mode === 'create'
                                    ? 'Create Task'
                                    : 'Update Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
