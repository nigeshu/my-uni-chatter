import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  BookMarked,
  Calendar,
  MessageSquare,
  TrendingUp,
  FileText,
  HelpCircle,
  Layers,
  MessageCircle,
} from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Section {
  name: string;
  icon: any;
  features: string[];
}

const sections: Section[] = [
  {
    name: 'Dashboard',
    icon: Layers,
    features: [
      'View enrolled courses count and total credits',
      'Track your CGPA at a glance',
      'See upcoming urgent assignments with deadlines',
      'View admin messages and notifications',
      'Access quick week calendar to check holidays',
      'Click notification icon to see all admin responses',
      'Watch platform trailer video anytime',
    ],
  },
  {
    name: 'Courses',
    icon: BookOpen,
    features: [
      'Browse all available theory and lab courses',
      'Filter courses by days, theory type, or lab type',
      'Search courses by name or description',
      'View course details including credits and class days',
      'Enroll in courses and select your preferred time slots',
      'Access course materials, documents, and PDFs',
      'Watch curated video lectures organized by categories',
      'Download previous year question papers (PYQs)',
      'View course syllabus organized by modules',
      'Edit your selected slot and lab days after enrollment',
    ],
  },
  {
    name: 'Assignments',
    icon: FileText,
    features: [
      'View all posted assignments with course names',
      'Check assignment deadlines and slot information',
      'Read detailed assignment instructions',
      'Mark assignments as completed when done',
      'Revert completed status if needed',
      'See which assignments are overdue in red',
      'Submit assignment requests to admin',
      'Track status of your submitted requests',
      'Receive admin feedback on your requests',
    ],
  },
  {
    name: 'Exams',
    icon: BookMarked,
    features: [
      'View all upcoming exams organized by categories',
      'Switch between Theory, Lab, and Non-Graded exams',
      'See exam dates and countdown to exam day',
      'Check exam portions by clicking on exam entries',
      'View exam status (upcoming or completed)',
      'Theory exams categorized into Cat 1, Cat 2, and FAT',
      'Lab exams show Lab FAT category',
      'Non-graded exams show Assessment 1-6 categories',
    ],
  },
  {
    name: 'Progress',
    icon: TrendingUp,
    features: [
      'View and manage your CGPA calculation',
      'Add new semesters with credits and GPA',
      'Edit existing semester data',
      'Delete semesters if needed',
      'View earned credits from semester entries',
      'Check course marks for all enrolled courses',
      'Switch between Theory and Lab marks sections',
      'Enter marks for CAT 1, CAT 2, DA 1-3, and FAT',
      'Mark components as absent when applicable',
      'See pass/fail status and marks needed to pass',
      'View total marks, marks lost, and maximum achievable',
      'Track grades for completed courses',
    ],
  },
  {
    name: 'My Space',
    icon: Layers,
    features: [
      'Create and manage study subjects',
      'Switch between Plan and Notes sections',
      'Add study plans with start and end dates',
      'Track remaining days for each plan',
      'Create subject-specific notes',
      'Add video content to subjects by categories',
      'Save videos from course materials to My Space',
      'Organize videos in custom categories',
      'Delete subjects when no longer needed',
      'Access all your personalized study materials',
    ],
  },
  {
    name: 'Query',
    icon: HelpCircle,
    features: [
      'Submit queries to admin with subject and message',
      'Track status of submitted queries (pending/responded)',
      'Receive admin responses to your questions',
      'View query history and responses',
      'Get confirmation when query is submitted',
    ],
  },
  {
    name: 'Academic Calendar',
    icon: Calendar,
    features: [
      'View full academic calendar in monthly format',
      'See holidays marked in green gradient',
      'See working days marked in red gradient',
      'Navigate between months using arrow buttons',
      'Current date highlighted with blue outline',
      'Calendar dates set by admin for entire semester',
    ],
  },
  {
    name: 'Lets Talk',
    icon: MessageCircle,
    features: [
      'Send friend requests to other students',
      'Accept or reject incoming friend requests',
      'Chat with accepted friends in real-time',
      'View list of all your friends',
      'Toggle friends panel on mobile devices',
      'See typing indicators when friend is typing',
      'Access AI chatbot for assistance',
    ],
  },
  {
    name: 'Course Materials',
    icon: MessageSquare,
    features: [
      'Contribute course materials to admin',
      'Specify course title, module, and topic',
      'Upload documents for admin review',
      'Receive admin feedback on contributions',
      'Track status of material submissions',
    ],
  },
];

export const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
  const [selectedSection, setSelectedSection] = useState<string>('Dashboard');

  const currentSection = sections.find((s) => s.name === selectedSection);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Student Guide - All Features
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[calc(85vh-80px)]">
          {/* Left Sidebar - Sections List */}
          <ScrollArea className="w-64 border-r">
            <div className="p-4 space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.name}
                    onClick={() => setSelectedSection(section.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      'hover:bg-muted/50',
                      selectedSection === section.name
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{section.name}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Right Content - Features */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {currentSection && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <currentSection.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">{currentSection.name}</h2>
                  </div>

                  <div className="space-y-3">
                    {currentSection.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{feature}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
