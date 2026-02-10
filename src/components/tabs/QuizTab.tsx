import { useState } from 'react';
import { useCreateQuizResult, useGetAllMaterialsSortedByDate, useSaveQuiz, useGetQuizzes, useDeleteQuiz } from '../../hooks/useQueries';
import { generateQuizFromContent, GeneratedQuestion } from '../../services/quizGenerator';
import { Slider } from '@/components/ui/slider';
import { Trash2, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Brain, CheckCircle2, XCircle, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface Question {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

// Convert GeneratedQuestion to component Question interface if needed, or unify.
// The component uses 'Question' interface locally defined which matches.

const sampleQuestions: Question[] = [
    {
        id: 1,
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
        explanation: 'Paris is the capital and most populous city of France.',
    },
    {
        id: 2,
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1,
        explanation: 'Mars is called the Red Planet due to its reddish appearance caused by iron oxide on its surface.',
    },
    {
        id: 3,
        question: 'What is the largest ocean on Earth?',
        options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correctAnswer: 3,
        explanation: 'The Pacific Ocean is the largest and deepest ocean on Earth.',
    },
    {
        id: 4,
        question: 'Who wrote "Romeo and Juliet"?',
        options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        correctAnswer: 1,
        explanation: 'William Shakespeare wrote the tragedy "Romeo and Juliet" in the early 1590s.',
    },
    {
        id: 5,
        question: 'What is the chemical symbol for gold?',
        options: ['Go', 'Gd', 'Au', 'Ag'],
        correctAnswer: 2,
        explanation: 'Au is the chemical symbol for gold, derived from the Latin word "aurum".',
    },
];

export default function QuizTab() {
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questions, setQuestions] = useState<Question[]>([]); // Use dynamic state instead of const
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [questionCount, setQuestionCount] = useState([5]);

    const createQuizResult = useCreateQuizResult();
    const saveQuiz = useSaveQuiz();
    const { data: materials = [] } = useGetAllMaterialsSortedByDate();
    const { data: savedQuizzes = [] } = useGetQuizzes();
    const deleteQuiz = useDeleteQuiz();

    // Initialize with sample if no generation happens
    const startSampleQuiz = () => {
        setQuestions(sampleQuestions);
        setSelectedAnswers(new Array(sampleQuestions.length).fill(null));
        setQuizStarted(true);
        setCurrentQuestion(0);
        setShowResults(false);
    };


    const handleGenerateQuiz = async () => {
        if (!selectedMaterialId) {
            toast.error('Please select a study material first');
            return;
        }

        const material = materials.find(m => m.id === selectedMaterialId);
        if (!material) return;

        setIsGenerating(true);
        try {
            const count = questionCount[0];
            const generatedQuestions = await generateQuizFromContent(material.content, 'medium', count);

            // Auto-save the quiz
            const quizTitle = `Quiz: ${material.title} (${new Date().toLocaleDateString()})`;
            await saveQuiz.mutateAsync({
                title: quizTitle,
                questions: generatedQuestions.map(q => ({
                    id: q.id.toString(),
                    text: q.question,
                    options: q.options,
                    correctOptionIndex: q.correctAnswer
                })),
                materialId: material.id
            });

            // Map to local Question interface
            const mappedQuestions: Question[] = generatedQuestions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
            }));

            setQuestions(mappedQuestions);
            setSelectedAnswers(new Array(mappedQuestions.length).fill(null));
            setQuizStarted(true);
            setCurrentQuestion(0);
            setShowResults(false);
            toast.success(`Generated and saved ${generatedQuestions.length} questions!`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate quiz');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLoadQuiz = (quiz: any) => {
        const mappedQuestions: Question[] = quiz.questions.map((q: any, index: number) => ({
            id: index + 1,
            question: q.text,
            options: q.options,
            correctAnswer: q.correctOptionIndex,
            explanation: "Review the material for more details." // Saved quizzes might not have explanation yet unless schema updated
        }));

        setQuestions(mappedQuestions);
        setSelectedAnswers(new Array(mappedQuestions.length).fill(null));
        setQuizStarted(true);
        setCurrentQuestion(0);
        setShowResults(false);
        toast.success(`Loaded "${quiz.title}"`);
    };

    const handleDeleteQuiz = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this saved quiz?')) {
            await deleteQuiz.mutateAsync(id);
            toast.success('Quiz deleted');
        }
    };


    const handleAnswerSelect = (answerIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = answerIndex;
        setSelectedAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = async () => {
        const score = selectedAnswers.filter(
            (answer, index) => answer === questions[index].correctAnswer
        ).length;

        try {
            await createQuizResult.mutateAsync({
                score: BigInt(score),
                totalQuestions: BigInt(questions.length),
            });
            setShowResults(true);
            toast.success('Quiz completed! Results saved.');
        } catch (error) {
            toast.error('Failed to save quiz results');
            console.error(error);
        }
    };

    const handleRestart = () => {
        setQuizStarted(false);
        setCurrentQuestion(0);
        setSelectedAnswers(new Array(questions.length).fill(null));
        setShowResults(false);
    };

    const calculateScore = () => {
        return selectedAnswers.filter(
            (answer, index) => answer === questions[index].correctAnswer
        ).length;
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    if (!quizStarted) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quiz Generator</h2>
                    <p className="text-muted-foreground">Test your knowledge with interactive quizzes</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* AI Generator Card */}
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                AI Quiz Generator
                            </CardTitle>
                            <CardDescription>
                                Automatically generate localized quizzes from your uploaded materials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Material</Label>
                                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a document..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {materials.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Number of Questions: {questionCount[0]}</Label>
                                </div>
                                <Slider
                                    value={questionCount}
                                    onValueChange={setQuestionCount}
                                    min={5}
                                    max={20}
                                    step={1}
                                    className="py-2"
                                />
                                <p className="text-xs text-muted-foreground">Select between 5 and 20 questions.</p>
                            </div>

                            <Button
                                onClick={handleGenerateQuiz}
                                className="w-full gap-2"
                                disabled={!selectedMaterialId || isGenerating}
                            >
                                {isGenerating ? (
                                    <>Generating...</>
                                ) : (
                                    <>
                                        <Brain className="h-4 w-4" />
                                        Generate & Save Quiz
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Saved Quizzes Card */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Save className="h-5 w-5" />
                                Saved Quizzes
                            </CardTitle>
                            <CardDescription>
                                Resume your previously generated quizzes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {savedQuizzes.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No saved quizzes yet. Generate one above!</p>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {savedQuizzes.map((quiz) => (
                                        <div key={quiz.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => handleLoadQuiz(quiz)}>
                                            <div className="space-y-1 overflow-hidden">
                                                <p className="font-medium truncate">{quiz.title}</p>
                                                <p className="text-xs text-muted-foreground">{quiz.questions.length} Questions • {new Date(quiz.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={(e) => { e.stopPropagation(); handleLoadQuiz(quiz); }}>
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={(e) => handleDeleteQuiz(e, quiz.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Start Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Practice</CardTitle>
                            <CardDescription>
                                Take a pre-made general knowledge quiz to warm up.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-muted p-4 text-center">
                                <p className="text-sm font-medium">General Knowledge Sample</p>
                                <p className="text-xs text-muted-foreground">{sampleQuestions.length} Questions</p>
                            </div>
                            <Button onClick={startSampleQuiz} variant="secondary" className="w-full">
                                Start Sample Quiz
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (showResults) {
        const score = calculateScore();
        const percentage = (score / questions.length) * 100;

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quiz Results</h2>
                    <p className="text-muted-foreground">Review your answers and performance</p>
                </div>

                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                            <span className="text-3xl font-bold text-primary-foreground">
                                {percentage.toFixed(0)}%
                            </span>
                        </div>
                        <CardTitle className="text-2xl">
                            You scored {score} out of {questions.length}
                        </CardTitle>
                        <CardDescription>
                            {percentage >= 80
                                ? 'Excellent work! 🎉'
                                : percentage >= 60
                                    ? 'Good job! Keep practicing. 👍'
                                    : 'Keep studying and try again! 📚'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={handleRestart} className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Take Quiz Again
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-4 max-w-2xl mx-auto">
                    <h3 className="text-xl font-semibold">Review Answers</h3>
                    {questions.map((question, index) => {
                        const userAnswer = selectedAnswers[index];
                        const isCorrect = userAnswer === question.correctAnswer;

                        return (
                            <Card key={question.id}>
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        {isCorrect ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                                        )}
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                Question {index + 1}: {question.question}
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                Your answer: {question.options[userAnswer ?? 0]}
                                                {!isCorrect && (
                                                    <>
                                                        <br />
                                                        Correct answer: {question.options[question.correctAnswer]}
                                                    </>
                                                )}
                                            </CardDescription>
                                            <p className="mt-2 text-sm text-muted-foreground">{question.explanation}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const allAnswered = selectedAnswers.every((answer) => answer !== null);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Quiz in Progress</h2>
                <p className="text-muted-foreground">
                    Question {currentQuestion + 1} of {questions.length}
                </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">{question.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup
                            value={selectedAnswers[currentQuestion]?.toString() ?? ''}
                            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                        >
                            <div className="space-y-3">
                                {question.options.map((option, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                                    >
                                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                        <Label
                                            htmlFor={`option-${index}`}
                                            className="flex-1 cursor-pointer font-normal"
                                        >
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                <div className="flex justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                    >
                        Previous
                    </Button>

                    <div className="flex gap-2">
                        {currentQuestion === questions.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={!allAnswered || createQuizResult.isPending}
                            >
                                {createQuizResult.isPending ? 'Submitting...' : 'Submit Quiz'}
                            </Button>
                        ) : (
                            <Button onClick={handleNext}>Next</Button>
                        )}
                    </div>
                </div>

                <div className="flex justify-center gap-2 pt-4">
                    {questions.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentQuestion(index)}
                            className={`h-2 w-2 rounded-full transition-all ${index === currentQuestion
                                ? 'w-8 bg-primary'
                                : selectedAnswers[index] !== null
                                    ? 'bg-primary/50'
                                    : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
