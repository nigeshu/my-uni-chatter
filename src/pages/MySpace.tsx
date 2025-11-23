import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, StickyNote } from 'lucide-react';
import { PlanSection } from '@/components/myspace/PlanSection';
import { NotesSection } from '@/components/myspace/NotesSection';

const MySpace = () => {
  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-background via-background to-primary/5 animate-fade-in">
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-bold">My Space</h1>
          <p className="text-muted-foreground mt-1">
            Organize your study plans and notes
          </p>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="plan"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 ease-out" />
              <Calendar className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">Plan</span>
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 ease-out" />
              <StickyNote className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">Notes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="animate-fade-in">
            <PlanSection />
          </TabsContent>

          <TabsContent value="notes" className="animate-fade-in">
            <NotesSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MySpace;
