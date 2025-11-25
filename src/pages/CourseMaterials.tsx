import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, Link, Video, File, Download, Play, Menu, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import CourseDetailDialog from '@/components/CourseDetailDialog';
import ModuleVideosDialog from '@/components/ModuleVideosDialog';

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  material_type: string;
  order_index: number;
  module_id: string | null;
}

interface Module {
  id: string;
  serial_no: string;
  topic: string;
  heading: string | null;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  duration_hours: number;
  credits?: number;
  class_days?: string[];
  course_type?: string;
}

interface Enrollment {
  id: string;
  selected_slot_id: string | null;
  selected_lab_days: string[] | null;
  course_slots?: {
    slot_name: string;
    days: string[];
  };
}

const CourseMaterials = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [videosDialogOpen, setVideosDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      checkEnrollment();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*, course_type')
      .eq('id', courseId)
      .single();
    if (data) {
      setCourse(data);
      setSelectedCourse(data);
    }
  };

  const checkEnrollment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('enrollments')
      .select(`
        id,
        selected_slot_id,
        selected_lab_days,
        course_slots (
          slot_name,
          days
        )
      `)
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .single();

    if (data) {
      setIsEnrolled(true);
      setEnrollment(data);
      fetchMaterials();
      fetchModules();
    }
    setLoading(false);
  };

  const fetchModules = async () => {
    const { data } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (data) setModules(data);
  };

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    
    if (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course materials. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    if (data) setMaterials(data);
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'file': return <File className="h-5 w-5" />;
      case 'link': return <Link className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) {
    return null;
  }

  if (!isEnrolled) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">
            Access Denied
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You need to enroll in this course to access the materials.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* Mobile Navigation Trigger */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Course Modules</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                <div className="space-y-2 pr-4">
                  {modules.map((module) => {
                    const moduleMaterials = materials.filter(m => m.module_id === module.id);
                    return (
                      <Button
                        key={module.id}
                        variant={expandedModule === module.id ? "secondary" : "ghost"}
                        className="w-full justify-start h-auto py-3 px-3"
                        onClick={() => {
                          setExpandedModule(module.id);
                          setMobileNavOpen(false);
                          // Scroll to the module
                          const element = document.getElementById(`module-${module.id}`);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        <div className="flex items-start gap-3 w-full text-left">
                          <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                            {module.serial_no}
                          </div>
                          <div className="flex-1 min-w-0">
                            {module.heading && (
                              <p className="font-semibold text-sm line-clamp-2">{module.heading}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {moduleMaterials.length} materials
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 mt-1" />
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {course?.title}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">Course Content</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-wrap">
          {course?.credits && (
            <div className="w-full sm:w-auto px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Credits:</span>
                <span className="text-lg font-bold text-primary">{course.credits}</span>
              </div>
            </div>
          )}
          
          {/* Display slot name for Theory courses */}
          {course?.course_type === 'theory' && enrollment?.course_slots?.slot_name && (
            <div className="w-full sm:w-auto px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Slot:</span>
                <span className="text-sm font-bold text-primary">{enrollment.course_slots.slot_name}</span>
              </div>
            </div>
          )}

          {/* Display slot days for Theory courses */}
          {course?.course_type === 'theory' && enrollment?.course_slots?.days && enrollment.course_slots.days.length > 0 && (
            <div className="w-full sm:w-auto px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Class Days:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {enrollment.course_slots.days.map((day, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-semibold text-primary border border-primary/20"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Display selected lab days for Lab courses */}
          {course?.course_type === 'lab' && enrollment?.selected_lab_days && enrollment.selected_lab_days.length > 0 && (
            <div className="w-full sm:w-auto px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Lab Days:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {enrollment.selected_lab_days.map((day, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-semibold text-primary border border-primary/20"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fallback: Display course class_days if no enrollment-specific days */}
          {!enrollment?.course_slots?.days && !enrollment?.selected_lab_days && course?.class_days && course.class_days.length > 0 && (
            <div className="w-full sm:w-auto px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Class Days:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {course.class_days.map((day, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-semibold text-primary border border-primary/20"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Tabs value="content" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger 
            value="course" 
            onClick={(e) => {
              e.preventDefault();
              setSelectedCourse(course);
              setShowDetailDialog(true);
            }}
          >
            Course Page
          </TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        {modules.map((module) => {
          const moduleMaterials = materials.filter(m => m.module_id === module.id);
          const isExpanded = expandedModule === module.id;
          
          return (
            <Card key={module.id} id={`module-${module.id}`} className="overflow-hidden scroll-mt-8">
              <CardContent className="p-0">
                <div 
                  className="flex items-center gap-3 p-6 cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white">{module.serial_no}</span>
                  </div>
                  <div className="flex-1">
                    {module.heading && (
                      <h3 className="text-lg font-semibold">{module.heading}</h3>
                    )}
                    <p className="text-sm text-muted-foreground">{moduleMaterials.length} materials</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModule(module);
                      setVideosDialogOpen(true);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Videos
                  </Button>
                </div>

                {isExpanded && (
                  <div className="border-t p-6 space-y-4 bg-accent/5">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Materials</h4>
                    
                    <div className="grid gap-4">
                      {moduleMaterials.length > 0 ? (
                        moduleMaterials.map((material) => (
                          <Card key={material.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/40">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {getMaterialIcon(material.material_type)}
                                <div className="flex-1">
                                  <h5 className="font-semibold">{material.title}</h5>
                                  <p className="text-sm text-muted-foreground capitalize mb-2">{material.material_type}</p>
                                  {material.description && (
                                    <p className="text-sm text-muted-foreground">{material.description}</p>
                                  )}
                                  {material.file_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-3"
                                      onClick={() => {
                                        setPreviewUrl(material.file_url);
                                        setPreviewTitle(material.title);
                                        setPreviewOpen(true);
                                      }}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Open
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                          <p className="text-sm text-muted-foreground">No materials available yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {modules.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl mb-4 opacity-50">
                <FileText className="h-20 w-20 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No modules available yet</h3>
              <p className="text-muted-foreground">Check back later for course content</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>{previewTitle || 'Resource preview'}</DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <div className="mt-4 h-[70vh]">
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-md border"
                title={previewTitle || 'Course resource preview'}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              Preview not available for this resource.
            </p>
          )}
          <div className="mt-4 flex justify-between gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {previewUrl && (
              <Button asChild>
                <a href={previewUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CourseDetailDialog
        course={selectedCourse}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <ModuleVideosDialog
        open={videosDialogOpen}
        onOpenChange={setVideosDialogOpen}
        module={selectedModule}
      />
    </div>
  );
};

export default CourseMaterials;
