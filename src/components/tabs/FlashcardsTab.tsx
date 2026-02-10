import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllMaterialsSortedByDate, useSaveFlashcardDeck, useUpdateFlashcardDeck, useGetFlashcardDecks, useDeleteFlashcardDeck } from '../../hooks/useQueries';
import { generateFlashcardsFromContent, type Flashcard } from '../../services/flashcardGenerator';
import { calculateSM2, initialSM2State } from '../../utils/sm2';
import { Layers, RotateCw, Check, X as XIcon, ChevronLeft, ChevronRight, Zap, Download, Upload, Save, Trash2, Play } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function FlashcardsTab() {
    const { data: materials = [] } = useGetAllMaterialsSortedByDate();
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [cardCount, setCardCount] = useState([10]);
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
    const [deckTitle, setDeckTitle] = useState<string>("");

    const saveDeck = useSaveFlashcardDeck();
    const updateDeck = useUpdateFlashcardDeck();
    const { data: savedDecks = [] } = useGetFlashcardDecks();
    const deleteDeck = useDeleteFlashcardDeck();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [studySessionActive, setStudySessionActive] = useState(false);
    const [knownCards, setKnownCards] = useState<Set<string>>(new Set());


    const handleGenerate = async () => {
        if (!selectedMaterialId) return;

        const material = materials.find(m => m.id === selectedMaterialId);
        if (!material) return;

        setIsGenerating(true);
        try {
            const count = cardCount[0];
            const cards = await generateFlashcardsFromContent(material.content, count);
            if (cards.length === 0) {
                toast.error('Could not generate flashcards from this content. Try a different text.');
            } else {
                const title = `Deck: ${material.title} (${new Date().toLocaleDateString()})`;
                const newDeckId = await saveDeck.mutateAsync({
                    title: title,
                    cards: cards,
                    materialId: material.id
                });

                setFlashcards(cards);
                setDeckTitle(title);
                setCurrentDeckId(newDeckId);
                setStudySessionActive(true);
                setCurrentIndex(0);
                setIsFlipped(false);
                setKnownCards(new Set());
                toast.success(`Generated and saved ${cards.length} flashcards!`);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to generate flashcards');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLoadDeck = (deck: any) => {
        const migratedCards = deck.cards.map((c: any) => ({
            ...initialSM2State,
            ...c
        }));

        setFlashcards(migratedCards);
        setCurrentDeckId(deck.id);
        setDeckTitle(deck.title);
        setStudySessionActive(true);
        setCurrentIndex(0);
        setIsFlipped(false);
        setKnownCards(new Set());
        toast.success(`Loaded "${deck.title}"`);
    };

    const handleDeleteDeck = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this saved deck?')) {
            await deleteDeck.mutateAsync(id);
            toast.success('Deck deleted');
        }
    };

    const handleRateCard = (quality: number) => {
        const currentCard = flashcards[currentIndex];
        const { interval, repetition, efactor } = currentCard;

        const nextState = calculateSM2(
            interval ?? 0,
            repetition ?? 0,
            efactor ?? 2.5,
            quality
        );

        const updatedCards = [...flashcards];
        updatedCards[currentIndex] = {
            ...currentCard,
            ...nextState
        };
        setFlashcards(updatedCards);


        let message = "";
        if (quality < 3) message = "Review soon";
        else if (quality === 3) message = "Hard";
        else if (quality === 4) message = "Good";
        else if (quality === 5) message = "Easy!";
        toast(message, {
            duration: 1000,
            description: `Next review: ${new Date(nextState.nextReviewDate).toLocaleDateString()}`
        });

        handleNext();
    };

    const handleSaveProgress = async () => {
        if (!currentDeckId) {
            toast.error("No active deck to save.");
            return;
        }

        try {
            await updateDeck.mutateAsync({
                id: currentDeckId,
                cards: flashcards
            });
            toast.success("Progress saved!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to save progress.");
        }
    };


    const handleExport = () => {
        if (flashcards.length === 0) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flashcards));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "study_deck.json");
        document.body.appendChild(downloadAnchorNode);
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

        event.target.value = '';
    };

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 300);
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
                    <p className="text-muted-foreground">Master key concepts with active recall (SM-2 Spaced Repetition)</p>
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
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Number of Cards: {cardCount[0]}</Label>
                                </div>
                                <Slider
                                    value={cardCount}
                                    onValueChange={setCardCount}
                                    min={5}
                                    max={30}
                                    step={1}
                                    className="py-2"
                                />
                                <p className="text-xs text-muted-foreground">Select between 5 and 30 cards.</p>
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={!selectedMaterialId || isGenerating}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <>Generating...</>
                                ) : (
                                    <><Zap className="nr-2 h-4 w-4" /> Generate & Save Flashcards</>
                                )}
                            </Button>
                        </div>

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

                        {savedDecks.length > 0 && (
                            <div className="pt-6 border-t">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Save className="h-4 w-4" /> Saved Decks
                                </h3>
                                <div className="grid gap-3">
                                    {savedDecks.map((deck) => (
                                        <div key={deck.id} className="flex items-center justify-between p-3 rounded border hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => handleLoadDeck(deck)}>
                                            <div className="overflow-hidden">
                                                <p className="font-medium truncate text-sm">{deck.title}</p>
                                                <p className="text-xs text-muted-foreground">{deck.cards.length} Cards • {new Date(deck.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={(e) => { e.stopPropagation(); handleLoadDeck(deck); }}>
                                                    <Play className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => handleDeleteDeck(e, deck.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

                            <div
                                className="absolute h-full w-full"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    zIndex: isFlipped ? 0 : 1
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


                            <div
                                className="absolute h-full w-full"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    zIndex: isFlipped ? 1 : 0
                                }}
                            >
                                <Card className="h-full flex items-center justify-center p-8 text-center bg-card border-primary/20 overflow-hidden relative">

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


                    {isFlipped ? (
                        <div className="grid grid-cols-4 gap-2">
                            <div className="flex flex-col gap-1">
                                <Button variant="destructive" className="h-auto py-3 flex flex-col items-center" onClick={() => handleRateCard(1)}>
                                    <span className="font-bold">Again</span>
                                    <span className="text-[10px] font-normal opacity-80">&lt; 1 min</span>
                                </Button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button variant="secondary" className=" bg-orange-100 hover:bg-orange-200 text-orange-900 h-auto py-3 flex flex-col items-center" onClick={() => handleRateCard(3)}>
                                    <span className="font-bold">Hard</span>
                                    <span className="text-[10px] font-normal opacity-80">2 days</span>
                                </Button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button variant="secondary" className="bg-blue-100 hover:bg-blue-200 text-blue-900 h-auto py-3 flex flex-col items-center" onClick={() => handleRateCard(4)}>
                                    <span className="font-bold">Good</span>
                                    <span className="text-[10px] font-normal opacity-80">4 days</span>
                                </Button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Button variant="secondary" className="bg-green-100 hover:bg-green-200 text-green-900 h-auto py-3 flex flex-col items-center" onClick={() => handleRateCard(5)}>
                                    <span className="font-bold">Easy</span>
                                    <span className="text-[10px] font-normal opacity-80">7 days</span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <Button variant="outline" size="lg" className="w-full max-w-sm" onClick={() => setIsFlipped(true)}>
                                Show Answer
                            </Button>
                        </div>
                    )}

                    <div className="text-center pt-4 border-t">
                        <div className="flex justify-center gap-4">
                            <Button variant="link" size="sm" onClick={() => setStudySessionActive(false)}>
                                <RotateCw className="mr-2 h-3 w-3" /> Stop Study
                            </Button>
                            <Button variant="link" size="sm" onClick={handleSaveProgress}>
                                <Save className="mr-2 h-3 w-3" /> Save Progress
                            </Button>
                            <Button variant="link" size="sm" onClick={handleExport}>
                                <Download className="mr-2 h-3 w-3" /> Export Deck
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
