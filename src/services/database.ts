import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'notStarted' | 'inProgress' | 'completed';

export interface StudyTask {
    id: string;
    title: string;
    description: string;
    dueDate: number;
    subjectTags: string[];
    status: TaskStatus;
    owner: string;
}

export interface UserProfile {
    name: string;
    email?: string;
    xp: number;
    level: number;
    dailyStreak: number;
    lastActivityDate: number;
    aiPersona?: string;
}

export interface UploadedMaterial {
    id: string;
    title: string;
    content: string;
    owner: string;
    createdAt: number;
    fileType: string;
    isPublic?: boolean;
    shareId?: string;
}

export enum FileType {
    pdf = 'pdf',
    text = 'text',
}

export interface QuizResult {
    id: string;
    score: bigint;
    totalQuestions: bigint;
    timestamp: bigint;
    user: string;
}

export enum DifficultyLevel {
    easy = 'easy',
    medium = 'medium',
    hard = 'hard',
}

export interface Topic {
    id: string;
    title: string;
    name: string;
    subtopics: string[];
    difficulty: DifficultyLevel;
}

export interface AnalyzedSyllabus {
    id: string;
    materialId: string;
    topics: Topic[];
    owner: string;
}

export interface StudySession {
    id: string;
    date: bigint;
    topicId: string;
    durationMinutes: number;
    completed: boolean;
}

export interface StudyPlan {
    id: string;
    sessions: StudySession[];
    examDate: bigint;
    hoursPerDay: bigint;
    owner: string;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
}

export interface Quiz {
    id: string;
    topicId: string;
    questions: Question[];

    owner: string;
}

export interface SavedQuiz {
    id: string;
    user_id: string;
    material_id?: string;
    title: string;
    questions: Question[];
    created_at: number;
}

export interface FlashcardDeck {
    id: string;
    user_id: string;
    material_id?: string;
    title: string;
    cards: {
        id: string;
        term: string;
        definition: string;
        interval?: number;
        repetition?: number;
        efactor?: number;
        nextReviewDate?: number;
    }[];
    created_at: number;
}

class DatabaseService {
    async getCallerUserProfile(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !data) return null;

        return {
            name: data.display_name,
            email: data.email,
            xp: data.xp,
            level: data.level,
            dailyStreak: data.daily_streak,
            lastActivityDate: data.last_activity_date,
            aiPersona: data.ai_persona // Read from DB
        };
    }

    async saveCallerUserProfile(profile: UserProfile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updateData: any = {
            id: user.id,
            display_name: profile.name,
            xp: profile.xp,
            level: profile.level,
            daily_streak: profile.dailyStreak,
            last_activity_date: profile.lastActivityDate,
            ai_persona: profile.aiPersona
        };

        if (profile.email) {
            updateData.email = profile.email;
        }

        await supabase
            .from('profiles')
            .upsert(updateData);
    }

    async addXp(amount: number): Promise<{ newLevel: number; leveledUp: boolean }> {
        const profile = await this.getCallerUserProfile();
        if (!profile) return { newLevel: 1, leveledUp: false };

        const currentXp = Number(profile.xp || 0);
        const currentLevel = profile.level || 1;
        const newXp = currentXp + amount;
        const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
        const leveledUp = newLevel > currentLevel;

        await this.saveCallerUserProfile({
            ...profile,
            xp: newXp,
            level: newLevel
        });

        return { newLevel, leveledUp };
    }

    // Tasks
    async getAllTasks(): Promise<StudyTask[]> {
        const { data } = await supabase.from('tasks').select('*');
        if (!data) return [];
        return data.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            dueDate: new Date(t.due_date).getTime(), // Ensure number
            subjectTags: t.subject_tags,
            status: t.status,
            owner: t.user_id
        }));
    }

    async createTask(title: string, description: string, dueDate: number, subjectTags: string[]): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const { data, error } = await supabase.from('tasks').insert({
            user_id: user.id,
            title,
            description,
            due_date: dueDate,
            subject_tags: subjectTags,
            status: 'notStarted'
        }).select().single();

        if (error) throw error;
        return data.id;
    }

    async updateTask(id: string, updates: Partial<StudyTask>) {
        // Map frontend fields to DB fields
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.description) dbUpdates.description = updates.description;

        await supabase.from('tasks').update(dbUpdates).eq('id', id);
    }

    async deleteTask(id: string) {
        await supabase.from('tasks').delete().eq('id', id);
    }

    // Materials
    async getAllMaterialsForCaller(): Promise<UploadedMaterial[]> {
        const { data } = await supabase.from('materials').select('*');
        if (!data) return [];

        return data.map(m => ({
            id: m.id,
            title: m.title,
            content: m.content,
            owner: m.user_id,
            createdAt: new Date(m.created_at).getTime(), // Ensure number (handle ISO string or number)
            fileType: m.file_type
        }));
    }

    async uploadMaterial(title: string, content: string, fileType: string): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const { data, error } = await supabase.from('materials').insert({
            user_id: user.id,
            title,
            content,
            file_type: fileType,
            created_at: Date.now()
        }).select().single();

        if (error) throw error;
        return data.id;
    }

    async deleteMaterial(id: string) {
        const { error } = await supabase.from('materials').delete().eq('id', id);
        if (error) throw error;
    }


    async makeMaterialPublic(id: string): Promise<string> {
        // First check if it already has a share_id, if not generate one (though DB default should handle it on insert, 
        // existing rows might need one if we didn't backfill). 
        // My SQL migration adds share_id default gen_random_uuid(), so all rows should have it.

        const { data, error } = await supabase
            .from('materials')
            .update({ is_public: true })
            .eq('id', id)
            .select('share_id')
            .single();

        if (error) throw error;
        return data.share_id;
    }

    async makeMaterialPrivate(id: string) {
        const { error } = await supabase
            .from('materials')
            .update({ is_public: false })
            .eq('id', id);
        if (error) throw error;
    }

    async importSharedMaterial(shareId: string): Promise<string> {
        // 1. Find the public material
        const { data: source, error } = await supabase
            .from('materials')
            .select('*')
            .eq('share_id', shareId)
            .eq('is_public', true)
            .single();

        if (error || !source) throw new Error("Material not found or not public");

        // 2. Create a copy for the current user
        return await this.uploadMaterial(
            `${source.title} (Imported)`,
            source.content,
            source.file_type
        );
    }
    async createAnalyzedSyllabus(materialId: string, topics: Topic[]): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const { error } = await supabase.from('analyzed_syllabi').insert({
            user_id: user.id,
            material_id: materialId,
            topics: topics, // JSONB column
            created_at: Date.now()
        });

        if (error) throw error;
    }

    // --- Quizzes Persistence ---

    async saveQuiz(title: string, questions: Question[], materialId?: string): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const { data, error } = await supabase.from('quizzes').insert({
            user_id: user.id,
            material_id: materialId || null,
            title,
            questions, // JSONB
            created_at: Date.now()
        }).select().single();

        if (error) throw error;
        return data.id;
    }

    async getQuizzes(): Promise<SavedQuiz[]> {
        const { data, error } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async deleteQuiz(id: string) {
        const { error } = await supabase.from('quizzes').delete().eq('id', id);
        if (error) throw error;
    }

    // --- Flashcards Persistence ---

    async saveFlashcardDeck(title: string, cards: any[], materialId?: string): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const { data, error } = await supabase.from('flashcard_decks').insert({
            user_id: user.id,
            material_id: materialId || null,
            title,
            cards, // JSONB
            created_at: Date.now()
        }).select().single();

        if (error) throw error;
        return data.id;
    }

    async updateFlashcardDeck(id: string, cards: any[]): Promise<void> {
        const { error } = await supabase
            .from('flashcard_decks')
            .update({ cards: cards })
            .eq('id', id);

        if (error) throw error;
    }

    async getFlashcardDecks(): Promise<FlashcardDeck[]> {
        const { data, error } = await supabase.from('flashcard_decks').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }

    async deleteFlashcardDeck(id: string) {
        const { error } = await supabase.from('flashcard_decks').delete().eq('id', id);
        if (error) throw error;
    }


    async getAllMaterialsSortedByDate() {
        const materials = await this.getAllMaterialsForCaller();
        return materials.sort((a, b) => a.createdAt - b.createdAt);
    }
}

export const databaseService = new DatabaseService();
