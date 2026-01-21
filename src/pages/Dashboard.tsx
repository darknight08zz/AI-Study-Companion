import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, ListTodo, Brain, TrendingUp, Library, Layers } from 'lucide-react';
import OverviewTab from '../components/tabs/OverviewTab';
import PlannerTab from '../components/tabs/PlannerTab';
import QuizTab from '../components/tabs/QuizTab';
import LibraryTab from '../components/tabs/LibraryTab';
import ProgressTab from '../components/tabs/ProgressTab';
import FlashcardsTab from '../components/tabs/FlashcardsTab';
import FocusModeTab from '../components/tabs/FocusModeTab';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="container py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto h-auto">
                    <TabsTrigger value="overview" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="library" className="gap-2">
                        <Library className="h-4 w-4" />
                        <span className="hidden sm:inline">Library</span>
                    </TabsTrigger>
                    <TabsTrigger value="planner" className="gap-2">
                        <ListTodo className="h-4 w-4" />
                        <span className="hidden sm:inline">Planner</span>
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="gap-2">
                        <Brain className="h-4 w-4" />
                        <span className="hidden sm:inline">Quiz</span>
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="gap-2">
                        <Layers className="h-4 w-4" />
                        <span className="hidden sm:inline">Flashcards</span>
                    </TabsTrigger>
                    <TabsTrigger value="progress" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Progress</span>
                    </TabsTrigger>
                    <TabsTrigger value="focus" className="gap-2">
                        <Brain className="h-4 w-4" />
                        <span className="hidden sm:inline">Focus</span>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <OverviewTab onNavigate={(tab) => setActiveTab(tab)} />
                    </TabsContent>

                    <TabsContent value="library" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <LibraryTab />
                    </TabsContent>

                    <TabsContent value="planner" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <PlannerTab />
                    </TabsContent>

                    <TabsContent value="quiz" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <QuizTab />
                    </TabsContent>

                    <TabsContent value="flashcards" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <FlashcardsTab />
                    </TabsContent>

                    <TabsContent value="progress" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <ProgressTab />
                    </TabsContent>

                    <TabsContent value="focus" className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                        <FocusModeTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
