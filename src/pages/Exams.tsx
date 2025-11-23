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
}

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
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
    const daysUntil = differenceInDays(date, new Date());
    return daysUntil === 0 ? "Today" : `Coming in ${daysUntil} days`;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Exams</h1>
        <p className="text-muted-foreground">View your upcoming exams and portions</p>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Exam Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No exams scheduled
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow
                  key={exam.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedExam(exam)}
                >
                  <TableCell className="font-medium">{exam.course_name}</TableCell>
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
