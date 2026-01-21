import { useState } from 'react';
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
} from '@/components/ui/dialog';
import { Upload, FileText, File, Trash2, Eye, Loader2, X, Sparkles, Brain, FileOutput } from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetAllMaterialsSortedByDate,
    useUploadMaterial,
    useUploadPdfWithBlob,
    useDeleteMaterial,
    useGetAnalyzedSyllabusByMaterial,
    useCreateAnalyzedSyllabus,
} from '../../hooks/useQueries';
import { FileType, DifficultyLevel, type UploadedMaterial, type Topic } from '../../services/database';
// import { ExternalBlob } from '../../services/localStorage'; // Not needed for types anymore
import { generateSummary, extractKeyPoints } from '../../services/summarizer';

// Helper class for Blob compatibility if needed locally, or just use any
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

    // Summarizer State
    const [summaryMaterial, setSummaryMaterial] = useState<UploadedMaterial | null>(null);
    const [summaryText, setSummaryText] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    const { data: materials = [], isLoading } = useGetAllMaterialsSortedByDate();
    const uploadMaterial = useUploadMaterial();
    const uploadPdfWithBlob = useUploadPdfWithBlob();
    const deleteMaterial = useDeleteMaterial();
    const createAnalyzedSyllabus = useCreateAnalyzedSyllabus();

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

                    // Cleaning heuristics
                    const cleanedText = fullText
                        .replace(/\s+/g, ' ')           // Normalize whitespace
                        .replace(/- /g, '')             // Fix hyphenated words (e.g. "exam- ple" -> "example")
                        .replace(/ \./g, '.')           // Fix floating periods
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
            // Simple AI-like analysis: extract topics from content
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

        // Simulate async processing
        setTimeout(() => {
            try {
                const summary = generateSummary(material.content);
                setSummaryText(summary);
                setIsSummarizing(false);
            } catch (e) {
                toast.error("Failed to generate summary");
                setIsSummarizing(false);
                setSummaryMaterial(null);
            }
        }, 1000);
    };

    const extractTopicsFromContent = (content: string): Topic[] => {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const topics: Topic[] = [];
        let topicCounter = 1;

        // Simple heuristic: look for numbered items, bullet points, or capitalized lines
        const topicPatterns = [
            /^\d+\.\s+(.+)/,           // 1. Topic
            /^[A-Z][^.!?]*$/,          // Capitalized line
            /^[-•]\s+(.+)/,            // Bullet points
            /^Chapter\s+\d+[:\s]+(.+)/i, // Chapter X: Topic
        ];

        for (const line of lines) {
            for (const pattern of topicPatterns) {
                const match = line.match(pattern);
                if (match) {
                    const topicName = (match[1] || line).trim();
                    if (topicName.length > 5 && topicName.length < 100) {
                        // Assign difficulty based on content complexity (simple heuristic)
                        const difficulty = assignDifficulty(topicName, content);

                        topics.push({
                            id: `topic-${topicCounter}`,
                            title: topicName,
                            name: topicName, // Kept for backward compatibility if needed
                            difficulty,
                            subtopics: [],
                        });
                        topicCounter++;
                        break;
                    }
                }
            }

            if (topics.length >= 10) break; // Limit to 10 topics
        }

        // If no topics found, create generic ones
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

        // Keywords for difficulty assessment
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
            <div className="flex items-center gap-3">
                <img src="/assets/generated/library-icon-transparent.dim_64x64.png" alt="Library" className="h-12 w-12" />
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Library</h2>
                    <p className="text-muted-foreground">Upload and manage your study materials</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Material</CardTitle>
                        <CardDescription>Add PDF files or text content to your library</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'pdf' | 'text')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="pdf">
                                    <File className="mr-2 h-4 w-4" />
                                    PDF Upload
                                </TabsTrigger>
                                <TabsTrigger value="text">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Text Input
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="pdf" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pdf-title">Title</Label>
                                    <Input
                                        id="pdf-title"
                                        placeholder="Enter material title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pdf-file">PDF File</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="pdf-file"
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handlePdfFileChange}
                                            disabled={isExtracting}
                                        />
                                        {pdfFile && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setPdfFile(null);
                                                    setExtractedText('');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {isExtracting && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Extracting text from PDF...
                                    </div>
                                )}

                                {extractedText && (
                                    <div className="space-y-2">
                                        <Label>Extracted Text Preview</Label>
                                        <ScrollArea className="h-40 rounded-md border bg-muted/50 p-3">
                                            <p className="text-sm whitespace-pre-wrap">{extractedText.slice(0, 500)}...</p>
                                        </ScrollArea>
                                        <p className="text-xs text-muted-foreground">
                                            {extractedText.length} characters extracted
                                        </p>
                                    </div>
                                )}

                                <img
                                    src="/assets/generated/pdf-upload-illustration.dim_400x300.png"
                                    alt="PDF Upload"
                                    className="w-full rounded-lg"
                                />
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
                    </CardContent>
                </Card>

                {/* Materials List */}
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

            {/* View Material Dialog */}
            <Dialog open={!!viewMaterial} onOpenChange={() => setViewMaterial(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
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

            {/* Smart Summary Dialog */}
            <Dialog open={!!summaryMaterial} onOpenChange={() => setSummaryMaterial(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Smart Summary: {summaryMaterial?.title}
                        </DialogTitle>
                        <DialogDescription>
                            AI-generated summary of key points
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {isSummarizing ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground animate-pulse">Analyzing content matrix...</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px] bg-muted/30 p-4 rounded-md border">
                                <p className="leading-relaxed whitespace-pre-wrap">{summaryText}</p>
                            </ScrollArea>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
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
    isAnalyzing,
    formatDate,
}: {
    material: UploadedMaterial;
    onView: () => void;
    onDelete: () => void;
    onAnalyze: () => void;
    onSummarize: () => void;
    isAnalyzing: boolean;
    formatDate: (timestamp: number) => string;
}) {
    const { data: analyzedSyllabus } = useGetAnalyzedSyllabusByMaterial(material.id);

    return (
        <div className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {material.fileType === FileType.pdf ? (
                            <File className="h-4 w-4 text-red-500 flex-shrink-0" />
                        ) : (
                            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                        <h4 className="font-semibold truncate">{material.title}</h4>
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
                        >
                            {isAnalyzing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 text-primary" />
                            )}
                        </Button>
                    )}
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
