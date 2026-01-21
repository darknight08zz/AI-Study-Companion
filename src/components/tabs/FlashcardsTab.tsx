import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllMaterialsSortedByDate } from '../../hooks/useQueries';
import { generateFlashcardsFromContent, type Flashcard } from '../../services/flashcardGenerator';
import { Layers, RotateCw, Check, X as XIcon, ChevronLeft, ChevronRight, Zap, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function FlashcardsTab() {
    const { data: materials = [] } = useGetAllMaterialsSortedByDate();
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Study Mode State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studySessionActive, setStudySessionActive] = useState(false);
    const [knownCards, setKnownCards] = useState<Set<string>>(new Set());

    const handleGenerate = () => {
        if (!selectedMaterialId) return;

        const material = materials.find(m => m.id === selectedMaterialId);
        if (!material) return;

        setIsGenerating(true);
        try {
            const cards = generateFlashcardsFromContent(material.content);
            if (cards.length === 0) {
                toast.error('Could not generate flashcards from this content. Try a different text.');
            } else {
                setFlashcards(cards);
                setStudySessionActive(true);
                setCurrentIndex(0);
                setIsFlipped(false);
                setKnownCards(new Set());
                toast.success(`Generated ${cards.length} flashcards!`);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to generate flashcards');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = () => {
        if (flashcards.length === 0) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flashcards));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "study_deck.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Deck exported successfully!");
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    const importedCards = JSON.parse(text) as Flashcard[];
                    // Basic validation
                    if (Array.isArray(importedCards) && importedCards.every(c => c.term && c.definition)) {
                        setFlashcards(importedCards);
                        setStudySessionActive(true);
                        setCurrentIndex(0);
                        setIsFlipped(false);
                        setKnownCards(new Set());
                        toast.success(`Imported ${importedCards.length} flashcards!`);
                    } else {
                        toast.error("Invalid file format. Please upload a valid deck JSON.");
                    }
                }
            } catch (err) {
                console.error("Error parsing JSON:", err);
                toast.error("Failed to parse the file.");
            }
        };
        reader.readAsText(fileObj);
        // Reset input so same file can be selected again if needed
        event.target.value = '';
    };

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 300); // Wait for flip back
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 300);
    };

    const markKnown = () => {
        setKnownCards(prev => new Set(prev).add(flashcards[currentIndex].id));
        toast.success("Marked as known!", { duration: 1000 });
        handleNext();
    };

    const markUnknown = () => {
        setKnownCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(flashcards[currentIndex].id);
            return newSet;
        });
        toast("Marked for review", { duration: 1000 });
        handleNext();
    };

    if (materials.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No Materials Found</h3>
                    <p className="text-center text-muted-foreground mb-4">
                        Upload study materials in the Library tab to generate flashcards.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Flashcards</h2>
                    <p className="text-muted-foreground">Master key concepts with active recall</p>
                </div>
            </div>

            {!studySessionActive ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Deck</CardTitle>
                        <CardDescription>Select a document to create AI flashcards from.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Material</label>
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
                        <Button
                            onClick={handleGenerate}
                            disabled={!selectedMaterialId || isGenerating}
                            className="w-full"
                        >
                            {isGenerating ? (
                                <>Generatng...</>
                            ) : (
                                <><Zap className="nr-2 h-4 w-4" /> Generate Flashcards</>
                            )}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or share with friends</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" className="w-full" onClick={() => document.getElementById('import-file')?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Import Deck
                            </Button>
                            <input
                                type="file"
                                id="import-file"
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />
                            <Button variant="outline" className="w-full" disabled>
                                <Download className="mr-2 h-4 w-4" /> Export (Active Deck)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Card {currentIndex + 1} of {flashcards.length}</span>
                        <span>{knownCards.size} mastered</span>
                    </div>

                    <div
                        className="relative h-64 w-full cursor-pointer group"
                        style={{ perspective: '1000px' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div
                            className="relative h-full w-full transition-all duration-500"
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                            }}
                        >
                            {/* Front */}
                            <div
                                className="absolute h-full w-full"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    zIndex: isFlipped ? 0 : 1 // Ensure front is top when not flipped
                                }}
                            >
                                <Card className="h-full flex items-center justify-center p-8 text-center hover:shadow-lg transition-shadow overflow-hidden bg-card">
                                    <div className="flex flex-col h-full justify-center items-center w-full">
                                        <p className="text-sm font-medium text-muted-foreground mb-4 shrink-0">TERM</p>
                                        <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                            <h3 className="text-xl md:text-2xl font-bold line-clamp-6">{flashcards[currentIndex].term}</h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-4 shrink-0 opacity-50">Click to flip</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Back */}
                            <div
                                className="absolute h-full w-full"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    zIndex: isFlipped ? 1 : 0 // Ensure back is top when flipped
                                }}
                            >
                                <Card className="h-full flex items-center justify-center p-8 text-center bg-card border-primary/20 overflow-hidden relative">
                                    {/* Decorative background for Back card */}
                                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

                                    <div className="flex flex-col h-full justify-center items-center w-full z-10">
                                        <p className="text-sm font-medium text-muted-foreground mb-4 shrink-0">DEFINITION</p>
                                        <div className="flex-1 flex items-center justify-center w-full overflow-y-auto">
                                            <p className="text-base md:text-lg">{flashcards[currentIndex].definition}</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" size="icon" onClick={handlePrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={markUnknown}>
                            <XIcon className="mr-2 h-4 w-4" /> Needs Review
                        </Button>
                        <Button variant="default" className="flex-1 bg-green-600 hover:bg-green-700" onClick={markKnown}>
                            <Check className="mr-2 h-4 w-4" /> Got it
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="text-center">
                        <Button variant="link" size="sm" onClick={() => setStudySessionActive(false)}>
                            <RotateCw className="mr-2 h-3 w-3" /> Start Over
                        </Button>
                        <Button variant="link" size="sm" onClick={handleExport}>
                            <Download className="mr-2 h-3 w-3" /> Export Deck
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
