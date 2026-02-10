import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseService } from '../services/database';
import { indexedDBService } from '../services/indexedDB';
import type {
    UserProfile,
    StudyTask,
    QuizResult,
    TaskStatus,
    UploadedMaterial,
    FileType,
    AnalyzedSyllabus,
    Topic,
    Quiz,
    StudyPlan,
    StudySession,

    Question,
    SavedQuiz,
    FlashcardDeck
} from '../services/database';

// User Profile Queries
export function useGetCallerUserProfile() {
    return useQuery<UserProfile | null>({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            return databaseService.getCallerUserProfile();
        },
    });
}

export function useSaveCallerUserProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profile: UserProfile) => {
            return databaseService.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

export function useAddXp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (amount: number) => {
            return databaseService.addXp(amount);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
            if (data.leveledUp) {
                // Return data so UI can handle toast if needed
            }
        },
    });
}

// Study Task Queries
export function useGetAllTasks() {
    return useQuery<StudyTask[]>({
        queryKey: ['tasks'],
        queryFn: async () => {
            return databaseService.getAllTasks();
        },
    });
}

export function useGetAllTasksSortedByDueDate() {
    return useQuery<StudyTask[]>({
        queryKey: ['tasks', 'sortedByDueDate'],
        queryFn: async () => {
            // Note: Cloud DB might filter differently, but for now we fetch all and sort or rely on service
            const tasks = await databaseService.getAllTasks();
            return tasks.sort((a, b) => Number(a.dueDate - b.dueDate));
        },
    });
}

export function useGetTasksByStatus(status: TaskStatus) {
    return useQuery<StudyTask[]>({
        queryKey: ['tasks', 'status', status],
        queryFn: async () => {
            const tasks = await databaseService.getAllTasks();
            return tasks.filter(t => t.status === status);
        },
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            title: string;
            description: string;
            dueDate: number;
            subjectTags: string[];
        }) => {
            return databaseService.createTask(
                params.title,
                params.description,
                params.dueDate,
                params.subjectTags
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            id: string;
            title?: string;
            description?: string;
            dueDate?: number;
            subjectTags?: string[];
            status?: TaskStatus;
        }) => {
            // @ts-ignore - Partial updates supported by service
            return databaseService.updateTask(params.id, params);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return databaseService.deleteTask(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}

// Quiz Result Queries
export function useGetQuizResultsForCaller() {
    return useQuery<QuizResult[]>({
        queryKey: ['quizResults'],
        // @ts-ignore - Not implemented yet
        queryFn: async () => { return []; },
    });
}

export function useCreateQuizResult() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { score: bigint; totalQuestions: bigint }) => {
            // @ts-ignore
            return "mock-id";
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizResults'] });
        },
    });
}

// Uploaded Materials Queries
export function useGetAllMaterials() {
    return useQuery<UploadedMaterial[]>({
        queryKey: ['materials'],
        queryFn: async () => {
            return databaseService.getAllMaterialsForCaller();
        },
    });
}

export function useGetAllMaterialsSortedByDate() {
    return useQuery<UploadedMaterial[]>({
        queryKey: ['materials', 'sortedByDate'],
        queryFn: async () => {
            return databaseService.getAllMaterialsSortedByDate();
        },
    });
}

export function useGetAllMaterialsSortedByTitle() {
    return useQuery<UploadedMaterial[]>({
        queryKey: ['materials', 'sortedByTitle'],
        queryFn: async () => {
            const materials = await databaseService.getAllMaterialsForCaller();
            return materials.sort((a, b) => a.title.localeCompare(b.title));
        },
    });
}

export function useUploadMaterial() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { title: string; content: string; fileType: FileType | string }) => {
            return databaseService.uploadMaterial(params.title, params.content, params.fileType);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}



// ... existing code ...

// Fallback for PDF blob (store as text for now or extend DB service later)
export function useUploadPdfWithBlob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { title: string; content: string; pdfBlob: any }) => {
            // 1. Save metadata and extracted text to Supabase
            const id = await databaseService.uploadMaterial(params.title, params.content, 'pdf');

            // 2. Save original PDF Blob to IndexedDB for offline access/viewing
            try {
                if (params.pdfBlob) {
                    await indexedDBService.saveFile(id, params.pdfBlob as Blob);
                }
            } catch (e) {
                console.error("Failed to save PDF blob to IndexedDB", e);
                // Non-fatal, we continue since we have the text
            }

            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

export function useDeleteMaterial() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await databaseService.deleteMaterial(id);
            try {
                await indexedDBService.deleteFile(id);
            } catch (e) {
                console.error("Failed to delete PDF blob from IndexedDB", e);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

// Sharing Queries
export function useMakeMaterialPublic() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return databaseService.makeMaterialPublic(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}


export function useImportSharedMaterial() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (shareId: string) => {
            return databaseService.importSharedMaterial(shareId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials'] });
        },
    });
}

// Sharing Queries


// --- Quizzes Persistence Hooks ---

export function useGetQuizzes() {
    return useQuery<SavedQuiz[]>({
        queryKey: ['quizzes'],
        queryFn: async () => {
            return databaseService.getQuizzes();
        },
    });
}

export function useSaveQuiz() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (params: { title: string; questions: Question[]; materialId?: string }) => {
            return databaseService.saveQuiz(params.title, params.questions, params.materialId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        },
    });
}

// --- Flashcard Decks Persistence Hooks ---

export function useGetFlashcardDecks() {
    return useQuery<FlashcardDeck[]>({
        queryKey: ['flashcard_decks'],
        queryFn: async () => {
            return databaseService.getFlashcardDecks();
        },
    });
}

export function useSaveFlashcardDeck() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (params: { title: string; cards: any[]; materialId?: string }) => {
            return databaseService.saveFlashcardDeck(params.title, params.cards, params.materialId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flashcard_decks'] });
        },
    });
}

export function useUpdateFlashcardDeck() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (params: { id: string; cards: any[] }) => {
            return databaseService.updateFlashcardDeck(params.id, params.cards);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flashcard_decks'] });
        },
    });
}

export function useDeleteFlashcardDeck() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return databaseService.deleteFlashcardDeck(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flashcard_decks'] });
        },
    });
}


export function useGetAllAnalyzedSyllabi() { return useQuery({ queryKey: ['stub'], queryFn: () => [] }); }
export function useGetAnalyzedSyllabusByMaterial(id: string) { return useQuery({ queryKey: ['stub'], queryFn: () => null }); }

export function useCreateAnalyzedSyllabus() {
    return useMutation({
        mutationFn: async (params: { materialId: string; topics: Topic[] }) => {
            return databaseService.createAnalyzedSyllabus(params.materialId, params.topics);
        }
    });
}
export function useUpdateAnalyzedSyllabus() { return useMutation({ mutationFn: async () => { } }); }
export function useDeleteAnalyzedSyllabus() { return useMutation({ mutationFn: async () => { } }); }

export function useGetAllStudyPlans() { return useQuery({ queryKey: ['stub'], queryFn: () => [] }); }
export function useCreateStudyPlan() { return useMutation({ mutationFn: async () => { } }); }
export function useUpdateStudyPlan() { return useMutation({ mutationFn: async () => { } }); }
export function useDeleteStudyPlan() { return useMutation({ mutationFn: async () => { } }); }
export function useGetAllQuizzes() { return useQuery({ queryKey: ['stub'], queryFn: () => [] }); }
export function useGetQuizzesByTopic(id: string) { return useQuery({ queryKey: ['stub'], queryFn: () => [] }); }
export function useCreateQuiz() { return useMutation({ mutationFn: async () => { } }); }
export function useDeleteQuiz() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return databaseService.deleteQuiz(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        },
    });
}
