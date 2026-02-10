import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'notStarted' | 'inProgress' | 'completed';

export const TaskStatusEnum = {
    notStarted: 'notStarted' as TaskStatus,
    inProgress: 'inProgress' as TaskStatus,
    completed: 'completed' as TaskStatus,
};


export const isTaskStatus = (status: TaskStatus, check: keyof typeof TaskStatusEnum) => {
    return status === check;
}

export enum DifficultyLevel {
    easy = 'easy',
    medium = 'medium',
    hard = 'hard',
}

export enum FileType {
    pdf = 'pdf',
    text = 'text',
}

export class ExternalBlob {
    private _blob: Uint8Array;

    constructor(blob: Uint8Array) {
        this._blob = blob;
    }

    static fromBytes(bytes: Uint8Array): ExternalBlob {
        return new ExternalBlob(bytes);
    }
}

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
    xp: number;
    level: number;
    dailyStreak: number;
    lastActivityDate: number;
}

export interface UploadedMaterial {
    id: string;
    title: string;
    content: string;
    owner: string;
    createdAt: number;
    fileType: FileType;
    originalFile?: any;
}

export interface QuizResult {
    id: string;
    score: number;
    totalQuestions: number;
    timestamp: number;
    user: string;
}

export interface AnalyzedSyllabus {
    id: string;
    materialId: string;
    topics: Topic[];
    owner: string;
}

export interface Topic {
    id: string;
    title: string;
    name: string;
    subtopics: string[];
    difficulty: DifficultyLevel;
}

export interface StudyPlan {
    id: string;
    sessions: StudySession[];
    examDate: number;
    hoursPerDay: number;
    owner: string;
}

export interface StudySession {
    id: string;
    date: number;
    topicId: string;
    durationMinutes: number;
    completed: boolean;
}

export interface Quiz {
    id: string;
    topicId: string;
    questions: Question[];
    owner: string;
}

export interface Question {
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
}


const CURRENT_USER_ID = 'local-user-principal-id';


const replacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};


const reviver = (key: string, value: any) => {
    if (typeof value === 'string' && /^\d+n$/.test(value)) {
        return Number(value.slice(0, -1));
    }
    return value;
};

class LocalStorageService {
    private getItem<T>(key: string): T | null {
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        try {
            return JSON.parse(stored, reviver);
        } catch (e) {
            console.error('Error parsing local storage item', key, e);
            return null;
        }
    }

    private setItem(key: string, value: any) {
        localStorage.setItem(key, JSON.stringify(value, replacer));
    }


    getCallerUserProfile(): UserProfile | null {
        return this.getItem<UserProfile>('userProfile');
    }

    saveCallerUserProfile(profile: UserProfile) {
        this.setItem('userProfile', profile);
    }


    addXp(amount: number): { newLevel: number; leveledUp: boolean } {
        const profile = this.getCallerUserProfile();
        if (!profile) return { newLevel: 1, leveledUp: false };

        const currentXp = Number(profile.xp || 0);
        const currentLevel = profile.level || 1;

        const newXp = currentXp + amount;
        const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
        const leveledUp = newLevel > currentLevel;

        this.saveCallerUserProfile({
            ...profile,
            xp: newXp,
            level: newLevel
        });

        this.updateStreak();

        return { newLevel, leveledUp };
    }

    updateStreak() {
        const profile = this.getCallerUserProfile();
        if (!profile) return;

        const now = new Date();
        const lastActivity = profile.lastActivityDate ? new Date(Number(profile.lastActivityDate)) : null;

        let newStreak = profile.dailyStreak || 0;

        if (lastActivity) {
            const isSameDay = now.toDateString() === lastActivity.toDateString();
            const isNextDay = new Date(now.getTime() - 86400000).toDateString() === lastActivity.toDateString();

            if (isNextDay) {
                newStreak++;
            } else if (!isSameDay) {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }

        this.saveCallerUserProfile({
            ...profile,
            dailyStreak: newStreak,
            lastActivityDate: now.getTime()
        });
    }


    getAllTasks(): StudyTask[] {
        const tasks = this.getItem<Record<string, StudyTask>>('studyTasks') || {};
        return Object.values(tasks);
    }

    getTasksByStatus(status: TaskStatus): StudyTask[] {
        const tasks = this.getAllTasks();
        return tasks.filter(t => t.status === status);
    }

    getAllTasksSortedByDueDate(): StudyTask[] {
        return this.getAllTasks().sort((a, b) => Number(a.dueDate - b.dueDate));
    }

    createTask(title: string, description: string, dueDate: number, subjectTags: string[]): string {
        const id = uuidv4();
        const task: StudyTask = {
            id,
            title,
            description,
            dueDate,
            subjectTags,
            status: 'notStarted',
            owner: CURRENT_USER_ID
        };
        const tasks = this.getItem<Record<string, StudyTask>>('studyTasks') || {};
        tasks[id] = task;
        this.setItem('studyTasks', tasks);
        return id;
    }

    updateTask(id: string, title: string, description: string, dueDate: number, subjectTags: string[], status: TaskStatus) {
        const tasks = this.getItem<Record<string, StudyTask>>('studyTasks') || {};
        if (tasks[id]) {
            tasks[id] = { ...tasks[id], title, description, dueDate, subjectTags, status };
            this.setItem('studyTasks', tasks);
        }
    }

    deleteTask(id: string) {
        const tasks = this.getItem<Record<string, StudyTask>>('studyTasks') || {};
        delete tasks[id];
        this.setItem('studyTasks', tasks);
    }


    getQuizResultsForCaller(): QuizResult[] {
        const results = this.getItem<Record<string, QuizResult>>('quizResults') || {};
        return Object.values(results);
    }

    createQuizResult(score: number, totalQuestions: number): string {
        const id = uuidv4();
        const result: QuizResult = {
            id,
            score,
            totalQuestions,
            timestamp: Date.now(),
            user: CURRENT_USER_ID
        };
        const results = this.getItem<Record<string, QuizResult>>('quizResults') || {};
        results[id] = result;
        this.setItem('quizResults', results);
        return id;
    }


    getAllMaterialsForCaller(): UploadedMaterial[] {
        const materials = this.getItem<Record<string, UploadedMaterial>>('materials') || {};
        return Object.values(materials);
    }

    getAllMaterialsSortedByDate(): UploadedMaterial[] {
        return this.getAllMaterialsForCaller().sort((a, b) => Number(a.createdAt - b.createdAt));
    }

    getAllMaterialsSortedByTitle(): UploadedMaterial[] {
        return this.getAllMaterialsForCaller().sort((a, b) => a.title.localeCompare(b.title));
    }

    uploadMaterial(title: string, content: string, fileType: FileType): string {
        const id = uuidv4();
        const material: UploadedMaterial = {
            id,
            title,
            content,
            owner: CURRENT_USER_ID,
            createdAt: Date.now(),
            fileType,
        };
        const materials = this.getItem<Record<string, UploadedMaterial>>('materials') || {};
        materials[id] = material;
        this.setItem('materials', materials);
        return id;
    }

    uploadPdfWithBlob(title: string, content: string, pdfBlob: any): string {
        const id = uuidv4();
        const material: UploadedMaterial = {
            id,
            title,
            content,
            owner: CURRENT_USER_ID,
            createdAt: Date.now(),
            fileType: FileType.pdf,
        };
        const materials = this.getItem<Record<string, UploadedMaterial>>('materials') || {};
        materials[id] = material;
        this.setItem('materials', materials);
        return id;
    }

    deleteMaterial(id: string) {
        const materials = this.getItem<Record<string, UploadedMaterial>>('materials') || {};
        delete materials[id];
        this.setItem('materials', materials);
    }

    getAllAnalyzedSyllabiForCaller(): AnalyzedSyllabus[] { return []; }
    getAnalyzedSyllabusByMaterial(materialId: string): AnalyzedSyllabus | null { return null; }
    createAnalyzedSyllabus(materialId: string, topics: Topic[]): string { return 'mock-id'; }
    updateAnalyzedSyllabus(id: string, topics: Topic[]): void { }
    deleteAnalyzedSyllabus(id: string): void { }

    getAllStudyPlansForCaller(): StudyPlan[] { return []; }
    createStudyPlan(sessions: StudySession[], examDate: number, hoursPerDay: number): string { return 'mock-id'; }
    updateStudyPlan(id: string, sessions: StudySession[], examDate: number, hoursPerDay: number): void { }
    deleteStudyPlan(id: string): void { }


    getAllQuizzesForCaller(): Quiz[] { return []; }
    getQuizzesByTopic(topicId: string): Quiz[] { return []; }
    createQuiz(questions: Question[], topicId: string): string { return 'mock-id'; }
    deleteQuiz(id: string): void { }

    getTasksByOwner(owner: string) { return this.getAllTasks(); }
}

export const localStorageService = new LocalStorageService();
