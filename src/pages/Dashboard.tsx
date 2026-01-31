import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import OverviewTab from '../components/tabs/OverviewTab';
import PlannerTab from '../components/tabs/PlannerTab';
import QuizTab from '../components/tabs/QuizTab';
import LibraryTab from '../components/tabs/LibraryTab';
import ProgressTab from '../components/tabs/ProgressTab';
import FlashcardsTab from '../components/tabs/FlashcardsTab';
import FocusModeTab from '../components/tabs/FocusModeTab';

interface DashboardProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function Dashboard({ activeTab, setActiveTab }: DashboardProps) {
    return (
        <div className="container py-8">
            <ErrorBoundary>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            </ErrorBoundary>
        </div>
    );
}

