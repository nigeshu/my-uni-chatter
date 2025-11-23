import { useEffect, useState } from "react";
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
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

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
    return daysUntil === 0 ? "Today" : `Coming in ${daysUntil} days`;
  };

  const filteredExams = exams.filter(exam => exam.exam_type === activeTab);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Exams</h1>
        <p className="text-muted-foreground">View your upcoming exams and portions</p>
      </div>

      {/* Tab Switcher with Liquid Hover */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit relative">
        <div 
          className="absolute top-1 bottom-1 bg-primary rounded-md transition-all duration-300 ease-in-out"
          style={{
            width: '33.333%',
            left: activeTab === "theory" ? "0%" : activeTab === "lab" ? "33.333%" : "66.666%",
          }}
        />
        <button
          onClick={() => setActiveTab("theory")}
          className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
            activeTab === "theory" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Theory
        </button>
        <button
          onClick={() => setActiveTab("lab")}
          className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
            activeTab === "lab" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lab
        </button>
        <button
          onClick={() => setActiveTab("non_graded")}
          className={`relative z-10 px-6 py-2 rounded-md font-medium transition-colors duration-300 ${
            activeTab === "non_graded" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Non Graded
        </button>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sub Category</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Exam Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No exams scheduled
                </TableCell>
              </TableRow>
            ) : (
              filteredExams.map((exam) => (
                <TableRow
                  key={exam.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedExam(exam)}
                >
                  <TableCell className="font-medium">{exam.sub_category}</TableCell>
                  <TableCell>{exam.course_name}</TableCell>
                  <TableCell>{format(new Date(exam.exam_date), "PPP")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        isPast(new Date(exam.exam_date))
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
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
      </Card>

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
