import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Brain, BookOpen } from 'lucide-react';
import type { AnalyzedSyllabus } from '../services/localStorage';
import { DifficultyLevel } from '../services/localStorage';

interface SyllabusAnalyzerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    analyzedSyllabus: AnalyzedSyllabus | null;
}

export default function SyllabusAnalyzerDialog({
    open,
    onOpenChange,
    analyzedSyllabus,
}: SyllabusAnalyzerDialogProps) {
    const getDifficultyColor = (difficulty: DifficultyLevel) => {
        switch (difficulty) {
            case DifficultyLevel.easy:
                return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
            case DifficultyLevel.medium:
                return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
            case DifficultyLevel.hard:
                return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
        }
    };

    const getDifficultyLabel = (difficulty: DifficultyLevel) => {
        switch (difficulty) {
            case DifficultyLevel.easy:
                return 'Easy';
            case DifficultyLevel.medium:
                return 'Medium';
            case DifficultyLevel.hard:
                return 'Hard';
        }
    };

    if (!analyzedSyllabus) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Analyzed Syllabus
                    </DialogTitle>
                    <DialogDescription>
                        AI-extracted topics and difficulty levels from your material
                    </DialogDescription>
                </DialogHeader>
                <Separator />
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                        {analyzedSyllabus.topics.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No topics found in this material</p>
                            </div>
                        ) : (
                            analyzedSyllabus.topics.map((topic, index) => (
                                <div
                                    key={topic.id}
                                    className="rounded-lg border bg-card p-4 space-y-2 animate-in slide-in-from-bottom"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-lg">{topic.name}</h4>
                                            {topic.subtopics.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {topic.subtopics.map((subtopic, idx) => (
                                                        <p key={idx} className="text-sm text-muted-foreground pl-4">
                                                            • {subtopic}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Badge className={getDifficultyColor(topic.difficulty)}>
                                            {getDifficultyLabel(topic.difficulty)}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <div className="flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
