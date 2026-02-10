import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Upload, FileText, File, Trash2, Eye, Loader2, X, Sparkles, Brain, FileOutput, Library, MessageCircle, Send, Bot, User, PenTool, Mic, Volume2, VolumeX, Share2, Download, Globe } from 'lucide-react'; // Added icons
import { toast } from 'sonner';
import { HandwritingUploader } from '../HandwritingUploader';
import { useSpeech } from '../../hooks/useSpeech';
import {
    useGetAllMaterialsSortedByDate,
    useUploadMaterial,
    useUploadPdfWithBlob,
    useDeleteMaterial,
    useGetAnalyzedSyllabusByMaterial,
    useCreateAnalyzedSyllabus,
    useGetCallerUserProfile,
    useMakeMaterialPublic,
    useImportSharedMaterial
} from '../../hooks/useQueries';
import { FileType, DifficultyLevel, type UploadedMaterial, type Topic } from '../../services/database';
import { generateSummary, extractKeyPoints } from '../../services/summarizer';
import { useStorageQuota } from '../../hooks/useStorageQuota';
import { chatWithMaterial, type ChatMessage } from '../../services/gemini';


class ExternalBlob {
    static fromBytes(bytes: Uint8Array) { return bytes; }
}

export default function LibraryTab() {
    const [uploadType, setUploadType] = useState<'pdf' | 'text'>('pdf');
    const [title, setTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [viewMaterial, setViewMaterial] = useState<UploadedMaterial | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [analyzingMaterialId, setAnalyzingMaterialId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    const { data: userProfile } = useGetCallerUserProfile();


    const { formattedUsage, percentage, isLowSpace, checkQuota } = useStorageQuota();

    useEffect(() => {
        if (isLowSpace) {
            toast.warning("Storage is running low! Please delete some files.", { duration: 5000 });
        }
    }, [isLowSpace]);


    const [summaryMaterial, setSummaryMaterial] = useState<UploadedMaterial | null>(null);
    const [summaryText, setSummaryText] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);


    const [chatMaterial, setChatMaterial] = useState<UploadedMaterial | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    const { data: materials = [], isLoading } = useGetAllMaterialsSortedByDate();
    const uploadMaterial = useUploadMaterial();
    const uploadPdfWithBlob = useUploadPdfWithBlob();
    const deleteMaterial = useDeleteMaterial();
    const createAnalyzedSyllabus = useCreateAnalyzedSyllabus();


    const [shareMaterial, setShareMaterial] = useState<UploadedMaterial | null>(null);
    const [importId, setImportId] = useState('');
    const makeMaterialPublic = useMakeMaterialPublic();
    const importSharedMaterial = useImportSharedMaterial();

    const { speak, stopSpeaking, listen, isListening, isSpeaking, isSupported: isSpeechSupported } = useSpeech();

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isChatting]);

    const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please select a valid PDF file');
            return;
        }

        setPdfFile(file);
        setIsExtracting(true);
        setExtractedText('');

        try {
            const text = await extractTextFromPdf(file);
            setExtractedText(text);
            if (!title) {
                setTitle(file.name.replace('.pdf', ''));
            }
            toast.success('PDF text extracted successfully');
        } catch (error) {
            console.error('Error extracting PDF text:', error);
            toast.error('Failed to extract text from PDF. Please try again.');
            setPdfFile(null);
        } finally {
            setIsExtracting(false);
        }
    };

    const extractTextFromPdf = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);

                    if (!(window as any).pdfjsLib) {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
                        document.head.appendChild(script);
                        await new Promise((resolve) => {
                            script.onload = resolve;
                        });
                        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
                    }

                    const pdfjsLib = (window as any).pdfjsLib;
                    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += pageText + ' ';
                    }

                    const cleanedText = fullText
                        .replace(/\s+/g, ' ')
                        .replace(/- /g, '')
                        .replace(/ \./g, '.')
                        .trim();

                    resolve(cleanedText);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleUpload = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        if (uploadType === 'pdf') {
            if (!pdfFile || !extractedText) {
                toast.error('Please select a PDF file and wait for text extraction');
                return;
            }

            try {
                const arrayBuffer = await pdfFile.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const blob = ExternalBlob.fromBytes(uint8Array);

                await uploadPdfWithBlob.mutateAsync({
                    title: title.trim(),
                    content: extractedText,
                    pdfBlob: blob,
                });

                toast.success('PDF uploaded successfully');
                resetForm();
            } catch (error: any) {
                console.error('Error uploading PDF:', error);
                if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
                    toast.error('Storage full! PDF is too large to save locally. Try a smaller file or clear some old materials.');
                } else {
                    toast.error('Failed to upload PDF. Please try again.');
                }
            }
        } else {
            if (!textContent.trim()) {
                toast.error('Please enter some text content');
                return;
            }

            try {
                await uploadMaterial.mutateAsync({
                    title: title.trim(),
                    content: textContent.trim(),
                    fileType: FileType.text,
                });

                toast.success('Text uploaded successfully');
                resetForm();
            } catch (error: any) {
                console.error('Error uploading text:', error);
                if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
                    toast.error('Storage full! Text is too large to save locally.');
                } else {
                    toast.error('Failed to upload text');
                }
            }
        }
    };

    const resetForm = () => {
        setTitle('');
        setTextContent('');
        setPdfFile(null);
        setExtractedText('');
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteMaterial.mutateAsync(deleteId);
            toast.success('Material deleted successfully');
            setDeleteId(null);
        } catch (error) {
            console.error('Error deleting material:', error);
            toast.error('Failed to delete material');
        }
    };

    const analyzeSyllabus = async (material: UploadedMaterial) => {
        setAnalyzingMaterialId(material.id);
        setIsAnalyzing(true);

        try {
            const topics = extractTopicsFromContent(material.content);

            await createAnalyzedSyllabus.mutateAsync({
                materialId: material.id,
                topics,
            });

            toast.success('Syllabus analyzed successfully!');
            setAnalyzingMaterialId(null);
        } catch (error) {
            console.error('Error analyzing syllabus:', error);
            toast.error('Failed to analyze syllabus');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSummarize = async (material: UploadedMaterial) => {
        setSummaryMaterial(material);
        setIsSummarizing(true);
        setSummaryText('');

        try {
            const summary = await generateSummary(material.content);
            setSummaryText(summary);
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate summary");
            setSummaryMaterial(null);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleChatOpen = (material: UploadedMaterial) => {
        setChatMaterial(material);
        setChatHistory([]);
        setChatInput('');
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim() || !chatMaterial) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', parts: userMessage }]);
        setIsChatting(true);

        try {
            const response = await chatWithMaterial(chatHistory, userMessage, chatMaterial.content, userProfile?.aiPersona);
            setChatHistory(prev => [...prev, { role: 'model', parts: response }]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message");
            setChatHistory(prev => [...prev, { role: 'model', parts: "I'm sorry, I couldn't process that request right now." }]);
        } finally {
            setIsChatting(false);
        }
    };

    const extractTopicsFromContent = (content: string): Topic[] => {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const topics: Topic[] = [];
        let topicCounter = 1;

        const topicPatterns = [
            /^\d+\.\s+(.+)/,
            /^[A-Z][^.!?]*$/,
            /^[-•]\s+(.+)/,
            /^Chapter\s+\d+[:\s]+(.+)/i,
        ];

        for (const line of lines) {
            for (const pattern of topicPatterns) {
                const match = line.match(pattern);
                if (match) {
                    const topicName = (match[1] || line).trim();
                    if (topicName.length > 5 && topicName.length < 100) {
                        const difficulty = assignDifficulty(topicName, content);

                        topics.push({
                            id: `topic-${topicCounter}`,
                            title: topicName,
                            name: topicName,
                            difficulty,
                            subtopics: [],
                        });
                        topicCounter++;
                        break;
                    }
                }
            }

            if (topics.length >= 10) break;
        }

        if (topics.length === 0) {
            const words = content.split(/\s+/).filter(w => w.length > 5);
            const uniqueWords = [...new Set(words)].slice(0, 5);

            uniqueWords.forEach((word, idx) => {
                topics.push({
                    id: `topic-${idx + 1}`,
                    title: word.charAt(0).toUpperCase() + word.slice(1),
                    name: word.charAt(0).toUpperCase() + word.slice(1),
                    difficulty: DifficultyLevel.medium,
                    subtopics: [],
                });
            });
        }

        return topics;
    };

    const assignDifficulty = (topicName: string, content: string): DifficultyLevel => {
        const lowerTopic = topicName.toLowerCase();
        const easyKeywords = ['introduction', 'basic', 'overview', 'fundamentals', 'simple'];
        const hardKeywords = ['advanced', 'complex', 'theory', 'analysis', 'optimization'];

        if (easyKeywords.some(kw => lowerTopic.includes(kw))) {
            return DifficultyLevel.easy;
        }
        if (hardKeywords.some(kw => lowerTopic.includes(kw))) {
            return DifficultyLevel.hard;
        }

        return DifficultyLevel.medium;
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">

            <div className="flex items-center gap-3 mb-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Library className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Library</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <p>Manage your study resources and chat with AI</p>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full border">
                            {formattedUsage} used
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle>Add New Material</CardTitle>
                        <CardDescription>Upload documents to generate quizzes and summaries</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'pdf' | 'text')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="pdf">PDF Document</TabsTrigger>
                                <TabsTrigger value="text">Paste Text</TabsTrigger>
                                <TabsTrigger value="handwriting">Handwriting</TabsTrigger>
                            </TabsList>
                            <TabsContent value="handwriting" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hw-title">Title</Label>
                                    <Input
                                        id="hw-title"
                                        placeholder="e.g., Biology Class Notes"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <HandwritingUploader onTranscriptionComplete={(text) => setTextContent(text)} />
                                {textContent && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                        <Label>Transcribed Text (Edit if needed)</Label>
                                        <Textarea
                                            value={textContent}
                                            onChange={(e) => setTextContent(e.target.value)}
                                            rows={8}
                                        />
                                        <Button onClick={() => setUploadType('text')} variant="outline" size="sm" className="w-full">
                                            Continue to Upload
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="pdf" className="space-y-4">

                                <div className="space-y-2">
                                    <Label htmlFor="pdf-title">Document Title</Label>
                                    <Input
                                        id="pdf-title"
                                        placeholder="e.g., Introduction to Biology"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>File Upload</Label>
                                    <div className="relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg border-muted-foreground/25 bg-muted/5 hover:bg-muted/10 transition-colors px-6 py-10 group cursor-pointer">
                                        <div className="text-center pointer-events-none">
                                            <div className="p-3 bg-background rounded-full inline-block shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="h-6 w-6 text-primary" />
                                            </div>
                                            <p className="text-sm font-medium">
                                                {pdfFile ? pdfFile.name : 'Click to select PDF'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {pdfFile ? (
                                                    <span className="text-primary font-medium">Ready to extract</span>
                                                ) : (
                                                    'PDF files up to 10MB'
                                                )}
                                            </p>
                                        </div>
                                        <Input
                                            id="pdf-file"
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfFileChange}
                                            disabled={isExtracting}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {pdfFile && (
                                            <button
                                                className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setPdfFile(null);
                                                    setExtractedText('');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {isExtracting && (
                                    <div className="flex items-center gap-2 text-sm text-primary animate-pulse bg-primary/5 p-3 rounded-md">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Extracting text content...
                                    </div>
                                )}
                                {extractedText && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Preview Content</Label>
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {extractedText.length} chars
                                            </Badge>
                                        </div>
                                        <ScrollArea className="h-32 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                                            {extractedText.slice(0, 300)}...
                                        </ScrollArea>
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="text" className="space-y-4">

                                <div className="space-y-2">
                                    <Label htmlFor="text-title">Title</Label>
                                    <Input
                                        id="text-title"
                                        placeholder="Enter material title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="text-content">Content</Label>
                                    <Textarea
                                        id="text-content"
                                        placeholder="Paste or type your study material here..."
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        rows={10}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">{textContent.length} characters</p>
                                </div>
                                <img
                                    src="/assets/generated/text-document-icon-transparent.dim_64x64.png"
                                    alt="Text Document"
                                    className="h-16 w-16 mx-auto opacity-50"
                                />
                            </TabsContent>
                        </Tabs>
                        <Button
                            onClick={handleUpload}
                            disabled={uploadMaterial.isPending || uploadPdfWithBlob.isPending || isExtracting}
                            className="w-full"
                        >
                            {uploadMaterial.isPending || uploadPdfWithBlob.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Material
                                </>
                            )}
                        </Button>

                        <Separator className="my-4" />

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Import Shared Material</h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Paste Share ID..."
                                    value={importId}
                                    onChange={(e) => setImportId(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!importId) return;
                                        importSharedMaterial.mutate(importId, {
                                            onSuccess: () => {
                                                toast.success("Material imported successfully!");
                                                setImportId('');
                                            },
                                            onError: () => toast.error("Failed to import. Check the ID.")
                                        });
                                    }}
                                    disabled={!importId || importSharedMaterial.isPending}
                                >
                                    {importSharedMaterial.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>


                <Card>
                    <CardHeader>
                        <CardTitle>Your Materials</CardTitle>
                        <CardDescription>
                            {materials.length} {materials.length === 1 ? 'item' : 'items'} in your library
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : materials.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No materials yet</p>
                                <p className="text-sm text-muted-foreground">Upload your first study material to get started</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="space-y-3">
                                    {materials.map((material) => (
                                        <MaterialCard
                                            key={material.id}
                                            material={material}
                                            onView={() => setViewMaterial(material)}
                                            onDelete={() => setDeleteId(material.id)}
                                            onAnalyze={() => analyzeSyllabus(material)}
                                            onSummarize={() => handleSummarize(material)}
                                            onChat={() => handleChatOpen(material)}
                                            onShare={() => {
                                                if (material.isPublic) {
                                                    navigator.clipboard.writeText(material.shareId || '');
                                                    toast.success("Share ID copied to clipboard!");
                                                } else {
                                                    makeMaterialPublic.mutate(material.id, {
                                                        onSuccess: (shareId) => {
                                                            toast.success("Material is now public! ID Copied.");
                                                            navigator.clipboard.writeText(shareId);
                                                        }
                                                    });
                                                }
                                            }}
                                            isAnalyzing={analyzingMaterialId === material.id && isAnalyzing}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>


            <Dialog open={!!viewMaterial} onOpenChange={() => setViewMaterial(null)}>
                <DialogContent className="w-full h-full max-w-none rounded-none sm:h-auto sm:max-h-[80vh] sm:max-w-3xl sm:rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {viewMaterial?.fileType === FileType.pdf ? (
                                <File className="h-5 w-5 text-red-500" />
                            ) : (
                                <FileText className="h-5 w-5 text-blue-500" />
                            )}
                            {viewMaterial?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {viewMaterial?.fileType === FileType.pdf ? 'PDF' : 'Text'} • Uploaded on{' '}
                            {viewMaterial && formatDate(viewMaterial.createdAt)}
                        </DialogDescription>
                    </DialogHeader>
                    <Separator />
                    <ScrollArea className="h-[500px] pr-4">
                        <div className="whitespace-pre-wrap text-sm">{viewMaterial?.content}</div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>


            <Dialog open={!!summaryMaterial} onOpenChange={() => setSummaryMaterial(null)}>
                <DialogContent className="w-full h-full max-w-none rounded-none sm:h-[95vh] sm:w-[95vw] sm:max-w-[95vw] sm:rounded-lg flex flex-col p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Sparkles className="h-6 w-6 text-primary" />
                            Smart Summary: {summaryMaterial?.title}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            AI-generated summary of key points
                        </DialogDescription>
                        <div className="absolute right-12 top-4">
                            <Button variant="outline" size="icon" onClick={() => isSpeaking ? stopSpeaking() : speak(summaryText)} disabled={!summaryText}>
                                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 mt-4">
                        {isSummarizing ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-xl text-muted-foreground animate-pulse">Analyzing content matrix...</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full bg-muted/30 p-8 rounded-lg border">
                                <p className="leading-relaxed whitespace-pre-wrap text-lg">{summaryText}</p>
                            </ScrollArea>
                        )}
                    </div>
                </DialogContent>
            </Dialog>


            <Dialog open={!!chatMaterial} onOpenChange={() => setChatMaterial(null)}>
                <DialogContent className="w-full h-full max-w-none rounded-none sm:h-[80vh] sm:max-w-5xl sm:rounded-lg flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            Chat with: {chatMaterial?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Ask questions about this document
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-4 p-4">
                            {chatHistory.length === 0 && (
                                <div className="text-center text-muted-foreground py-10">
                                    <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>Ask me anything about this document!</p>
                                </div>
                            )}
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-3 overflow-hidden ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted dark:bg-muted/50'
                                        }`}>
                                        <div className="prose dark:prose-invert prose-sm max-w-none break-words leading-relaxed">
                                            <ReactMarkdown>
                                                {msg.parts}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    {msg.role === 'model' && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 mt-2 opacity-50 hover:opacity-100" onClick={() => speak(msg.parts)}>
                                            <Volume2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">AI is thinking...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatScrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                        <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type a question..."
                            disabled={isChatting}
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => {
                                if (!isSpeechSupported) {
                                    toast.error("Speech recognition is not supported in this browser.");
                                    return;
                                }
                                listen((text) => setChatInput(text));
                            }}
                            className={isListening ? "animate-pulse bg-red-100 text-red-600" : ""}
                            title={isSpeechSupported ? "Speak to type" : "Speech recognition not supported"}
                            disabled={!isSpeechSupported && !isListening}
                        >
                            <Mic className={`h-4 w-4 ${!isSpeechSupported ? 'opacity-50' : ''}`} />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Material</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this material? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleteMaterial.isPending}>
                            {deleteMaterial.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function MaterialCard({
    material,
    onView,
    onDelete,
    onAnalyze,
    onSummarize,
    onChat,
    onShare,
    isAnalyzing,
    formatDate,
}: {
    material: UploadedMaterial;
    onView: () => void;
    onDelete: () => void;
    onAnalyze: () => void;
    onSummarize: () => void;
    onChat: () => void;
    onShare: () => void;
    isAnalyzing: boolean;
    formatDate: (timestamp: number) => string;
}) {
    const { data: analyzedSyllabus } = useGetAnalyzedSyllabusByMaterial(material.id);

    return (
        <div className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {material.fileType === FileType.pdf ? (
                            <File className="h-4 w-4 text-red-500 flex-shrink-0" />
                        ) : (
                            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                        <h4 className="font-semibold truncate">{material.title}</h4>
                        {material.isPublic && (
                            <Badge variant="outline" className="ml-2 text-[10px] h-5 px-1 bg-blue-50 text-blue-600 border-blue-200">
                                <Globe className="h-3 w-3 mr-1" /> Public
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <Badge variant="outline" className="text-xs">
                            {material.fileType === FileType.pdf ? 'PDF' : 'Text'}
                        </Badge>
                        <span>•</span>
                        <span>{formatDate(material.createdAt)}</span>
                        <span>•</span>
                        <span>{material.content.length} chars</span>
                        {analyzedSyllabus && (
                            <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs">
                                    <Brain className="h-3 w-3 mr-1" />
                                    Analyzed
                                </Badge>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    {!analyzedSyllabus && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onAnalyze}
                            disabled={isAnalyzing}
                            title="Analyze syllabus"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onShare}
                        title="Share Material"
                        className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onShare}
                        title={material.isPublic ? "Copy Share ID" : "Make Public & Share"}
                        className={`h-8 w-8 ${material.isPublic ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground hover:text-blue-500'}`}
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onChat}
                        title="Chat with Document"
                    >
                        <MessageCircle className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSummarize}
                        title="Generate Summary"
                    >
                        <FileOutput className="h-4 w-4 text-orange-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onView}
                        title="View content"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        title="Delete material"
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
