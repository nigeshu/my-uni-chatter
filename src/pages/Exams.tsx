import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isPast } from "date-fns";

interface Exam {
  id: string;
  course_name: string;
  exam_date: string;
  portions: string;
  exam_type: string;
  sub_category: string;
}

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeTab, setActiveTab] = useState<"theory" | "lab" | "non_graded">("theory");
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const theoryRef = useRef<HTMLButtonElement>(null);
  const labRef = useRef<HTMLButtonElement>(null);
  const nonGradedRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    const updateIndicator = () => {
      const refs = {
        theory: theoryRef,
        lab: labRef,
        non_graded: nonGradedRef
      };
      const activeRef = refs[activeTab];
      if (activeRef.current) {
        const { offsetWidth, offsetLeft } = activeRef.current;
        setIndicatorStyle({ width: offsetWidth, left: offsetLeft });
      }
    };
    
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("exam_date", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch exams",
        variant: "destructive",
      });
      return;
    }

    setExams(data || []);
  };

  const getExamStatus = (examDate: string) => {
    const date = new Date(examDate);
    if (isPast(date)) {
      return "Completed";
    }
    const daysUntil = Math.ceil(differenceInDays(date, new Date()));
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Coming in 1 day";
    return `Coming in ${daysUntil} days`;
  };

  const groupExamsByCategory = (examType: string) => {
    const filtered = exams.filter(exam => exam.exam_type === examType);
    const grouped: Record<string, Exam[]> = {};
    
    filtered.forEach(exam => {
      if (!grouped[exam.sub_category]) {
        grouped[exam.sub_category] = [];
      }
      grouped[exam.sub_category].push(exam);
    });
    
    return grouped;
  };

  const renderExamTable = (categoryExams: Exam[], categoryName: string) => (
    <Card key={categoryName} className="p-4 sm:p-6 hover:shadow-lg transition-shadow animate-fade-in">
      <h3 className="text-base sm:text-lg font-semibold mb-4 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent w-fit px-2 py-1">
        {categoryName}
      </h3>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap text-base">Course Name</TableHead>
                <TableHead className="whitespace-nowrap text-base">Date</TableHead>
                <TableHead className="whitespace-nowrap text-base">Exam Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-base">
                    No exams scheduled
                  </TableCell>
                </TableRow>
              ) : (
                categoryExams.map((exam) => (
                  <TableRow
                    key={exam.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedExam(exam)}
                  >
                    <TableCell className="font-medium whitespace-nowrap text-base">{exam.course_name}</TableCell>
                    <TableCell className="whitespace-nowrap text-base">{format(new Date(exam.exam_date), "PPP")}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium whitespace-nowrap inline-block ${
                          isPast(new Date(exam.exam_date))
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {getExamStatus(exam.exam_date)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );

  const groupedExams = {
    theory: groupExamsByCategory("theory"),
    lab: groupExamsByCategory("lab"),
    non_graded: groupExamsByCategory("non_graded")
  };

  const renderTabContent = () => {
    const currentGrouped = groupedExams[activeTab];
    const categories = Object.keys(currentGrouped);
    
    if (categories.length === 0) {
      return (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No exams scheduled</p>
        </Card>
      );
    }

    if (activeTab === "theory") {
      return (
        <div className="grid gap-4">
          {["Cat 1", "Cat 2", "FAT"].map(category => 
            currentGrouped[category] && currentGrouped[category].length > 0 
              ? renderExamTable(currentGrouped[category], category)
              : null
          )}
        </div>
      );
    } else if (activeTab === "non_graded") {
      return (
        <div className="grid gap-4">
          {["Assessment 1", "Assessment 2", "Assessment 3", "Assessment 4", "Assessment 5", "Assessment 6"].map(category =>
            currentGrouped[category] && currentGrouped[category].length > 0
              ? renderExamTable(currentGrouped[category], category)
              : null
          )}
        </div>
      );
    } else {
      // Lab - show all categories dynamically
      return (
        <div className="grid gap-4">
          {categories.map(category =>
            renderExamTable(currentGrouped[category], category)
          )}
        </div>
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Exams</h1>
          <p className="text-muted-foreground text-sm sm:text-base">View your upcoming exams and portions</p>
        </div>
        <div className="text-sm sm:text-base text-muted-foreground italic">
          Click To View Portions
        </div>
      </div>

      {/* Tab Switcher with Liquid Hover */}
      <div className="flex gap-1 sm:gap-2 p-1 bg-muted rounded-lg w-full sm:w-fit relative overflow-x-auto">
        <div 
          className="absolute top-1 bottom-1 bg-primary rounded-md transition-all duration-300 ease-in-out"
          style={{
            width: `${indicatorStyle.width}px`,
            left: `${indicatorStyle.left}px`,
          }}
        />
        <button
          ref={theoryRef}
          onClick={() => setActiveTab("theory")}
          className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
            activeTab === "theory" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Theory
        </button>
        <button
          ref={labRef}
          onClick={() => setActiveTab("lab")}
          className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
            activeTab === "lab" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lab
        </button>
        <button
          ref={nonGradedRef}
          onClick={() => setActiveTab("non_graded")}
          className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
            activeTab === "non_graded" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Non Graded
        </button>
      </div>

      {renderTabContent()}

      <Dialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedExam?.course_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sub Category</p>
              <p className="text-lg">{selectedExam?.sub_category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Exam Date</p>
              <p className="text-lg">
                {selectedExam && format(new Date(selectedExam.exam_date), "PPP")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Portions</p>
              <p className="whitespace-pre-wrap">{selectedExam?.portions}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Exams;
