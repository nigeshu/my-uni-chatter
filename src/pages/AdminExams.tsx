import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: string;
  course_name: string;
  exam_date: string;
  portions: string;
  exam_type: string;
  sub_category: string;
}

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [portions, setPortions] = useState("");
  const [examType, setExamType] = useState("theory");
  const [subCategory, setSubCategory] = useState("Cat 1");
  const [customLabCategory, setCustomLabCategory] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    // Update subcategory based on exam type
    if (examType === "theory") {
      setSubCategory("Cat 1");
    } else if (examType === "lab") {
      setSubCategory("Lab FAT");
    } else if (examType === "non_graded") {
      setSubCategory("Assessment 1");
    }
  }, [examType]);

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

  const handleAddExam = async () => {
    if (!courseName || !examDate || !portions || !examType || !subCategory) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("exams").insert([
      {
        course_name: courseName,
        exam_date: examDate,
        portions: portions,
        exam_type: examType,
        sub_category: subCategory,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add exam",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Exam added successfully",
    });

    setCourseName("");
    setExamDate("");
    setPortions("");
    setCustomLabCategory("");
    setAddDialogOpen(false);
    fetchExams();
  };

  const handleEditExam = async () => {
    if (!editingExam || !editingExam.course_name || !editingExam.exam_date || !editingExam.portions) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("exams")
      .update({
        course_name: editingExam.course_name,
        exam_date: editingExam.exam_date,
        portions: editingExam.portions,
      })
      .eq("id", editingExam.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update exam",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Exam updated successfully",
    });

    setEditDialogOpen(false);
    setEditingExam(null);
    fetchExams();
  };

  const handleDeleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete exam",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Exam deleted successfully",
    });

    fetchExams();
  };

  const getSubCategoryOptions = () => {
    if (examType === "theory") {
      return ["Cat 1", "Cat 2", "FAT"];
    } else if (examType === "lab") {
      const labCategories = exams
        .filter(e => e.exam_type === "lab" && e.sub_category !== "Lab FAT")
        .map(e => e.sub_category)
        .filter((v, i, a) => a.indexOf(v) === i);
      return ["Lab FAT", ...labCategories, "custom"];
    } else if (examType === "non_graded") {
      return ["Assessment 1", "Assessment 2", "Assessment 3", "Assessment 4", "Assessment 5", "Assessment 6"];
    }
    return [];
  };

  const getExamTypeLabel = (type: string) => {
    switch(type) {
      case "theory": return "Theory";
      case "lab": return "Lab";
      case "non_graded": return "Non Graded";
      default: return type;
    }
  };

  const groupExamsByTypeAndCategory = () => {
    const grouped: Record<string, Record<string, Exam[]>> = {
      theory: {},
      lab: {},
      non_graded: {}
    };

    exams.forEach(exam => {
      if (!grouped[exam.exam_type][exam.sub_category]) {
        grouped[exam.exam_type][exam.sub_category] = [];
      }
      grouped[exam.exam_type][exam.sub_category].push(exam);
    });

    return grouped;
  };

  const renderExamTable = (categoryExams: Exam[], categoryName: string) => (
    <Card key={categoryName} className="p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent w-fit px-2 py-1">
        {categoryName}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Portions</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoryExams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No exams scheduled
              </TableCell>
            </TableRow>
          ) : (
            categoryExams.map((exam) => (
              <TableRow key={exam.id} className="hover:bg-accent/50 transition-colors">
                <TableCell className="font-medium">{exam.course_name}</TableCell>
                <TableCell>{format(new Date(exam.exam_date), "PPP")}</TableCell>
                <TableCell className="max-w-md truncate">{exam.portions}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingExam(exam);
                        setEditDialogOpen(true);
                      }}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExam(exam.id)}
                      className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );

  const groupedExams = groupExamsByTypeAndCategory();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Exams</h1>
          <p className="text-muted-foreground">Add and manage exam schedules</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="examType">Exam Type</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="non_graded">Non Graded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subCategory">Sub Category</Label>
                {examType === "lab" && subCategory === "custom" ? (
                  <Input
                    id="customLabCategory"
                    value={customLabCategory}
                    onChange={(e) => {
                      setCustomLabCategory(e.target.value);
                      setSubCategory(e.target.value);
                    }}
                    placeholder="Enter custom lab category"
                  />
                ) : (
                  <Select value={subCategory} onValueChange={setSubCategory}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {getSubCategoryOptions().map(option => (
                        <SelectItem key={option} value={option}>
                          {option === "custom" ? "+ Add Custom Category" : option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="courseName">Course Name</Label>
                <Input
                  id="courseName"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="examDate">Exam Date</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="portions">Portions</Label>
                <Textarea
                  id="portions"
                  value={portions}
                  onChange={(e) => setPortions(e.target.value)}
                  placeholder="Enter exam portions"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddExam}>Add Exam</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Theory Exams */}
      {Object.keys(groupedExams.theory).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Theory Exams</h2>
          <div className="grid gap-4">
            {["Cat 1", "Cat 2", "FAT"].map(category => 
              groupedExams.theory[category] && groupedExams.theory[category].length > 0 
                ? renderExamTable(groupedExams.theory[category], category)
                : null
            )}
          </div>
        </div>
      )}

      {/* Lab Exams */}
      {Object.keys(groupedExams.lab).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Lab Exams</h2>
          <div className="grid gap-4">
            {Object.keys(groupedExams.lab).map(category =>
              renderExamTable(groupedExams.lab[category], category)
            )}
          </div>
        </div>
      )}

      {/* Non Graded Exams */}
      {Object.keys(groupedExams.non_graded).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Non Graded Assessments</h2>
          <div className="grid gap-4">
            {["Assessment 1", "Assessment 2", "Assessment 3", "Assessment 4", "Assessment 5", "Assessment 6"].map(category =>
              groupedExams.non_graded[category] && groupedExams.non_graded[category].length > 0
                ? renderExamTable(groupedExams.non_graded[category], category)
                : null
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
          </DialogHeader>
          {editingExam && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Exam Type: {getExamTypeLabel(editingExam.exam_type)}</Label>
              </div>
              <div>
                <Label>Sub Category: {editingExam.sub_category}</Label>
              </div>
              <div>
                <Label htmlFor="editCourseName">Course Name</Label>
                <Input
                  id="editCourseName"
                  value={editingExam.course_name}
                  onChange={(e) => setEditingExam({...editingExam, course_name: e.target.value})}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="editExamDate">Exam Date</Label>
                <Input
                  id="editExamDate"
                  type="date"
                  value={editingExam.exam_date}
                  onChange={(e) => setEditingExam({...editingExam, exam_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editPortions">Portions</Label>
                <Textarea
                  id="editPortions"
                  value={editingExam.portions}
                  onChange={(e) => setEditingExam({...editingExam, portions: e.target.value})}
                  placeholder="Enter exam portions"
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditExam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExams;
