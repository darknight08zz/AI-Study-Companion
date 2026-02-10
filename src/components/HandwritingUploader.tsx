import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Camera, X } from 'lucide-react';
import { transcribeHandwrittenNote } from '@/services/gemini';
import { toast } from 'sonner';

interface HandwritingUploaderProps {
    onTranscriptionComplete: (text: string) => void;
}

export function HandwritingUploader({ onTranscriptionComplete }: HandwritingUploaderProps) {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }


        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        setIsTranscribing(true);
        try {
            const text = await transcribeHandwrittenNote(file);
            onTranscriptionComplete(text);
            toast.success('Handwriting transcribed! You can now edit the text.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to transcribe handwriting');
            setPreviewUrl(null);
        } finally {
            setIsTranscribing(false);
        }
    };

    const clearPreview = () => {
        setPreviewUrl(null);
    }

    return (
        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
            {previewUrl ? (
                <div className="relative w-full max-w-sm rounded-lg overflow-hidden border shadow-sm">
                    <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover" />
                    {isTranscribing && (
                        <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center backdrop-blur-sm">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="font-medium text-sm">Reading handwriting...</p>
                        </div>
                    )}
                    {!isTranscribing && (
                        <button
                            onClick={clearPreview}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-center space-y-2">
                    <div className="p-4 bg-primary/10 rounded-full inline-flex text-primary mb-2">
                        <Camera className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium">Upload Handwritten Notes</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Take a photo of your notes and AI will convert them to text.
                    </p>
                    <div className="pt-2">
                        <Button variant="outline" className="relative cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <Upload className="mr-2 h-4 w-4" />
                            Select Image
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
