import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, Link, Video, File, Download, Play, Menu, ChevronRight, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

interface PYQ {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
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
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [currentTab, setCurrentTab] = useState<'content' | 'pyqs'>('content');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [uploadingPyq, setUploadingPyq] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      checkEnrollment();
      fetchUserRole();
    }
  }, [courseId]);

  const sortDays = (days: string[]): string[] => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  };

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

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (data) setUserRole(data.role);
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
      
      // Sort days before setting enrollment
      if (data.course_slots && (data.course_slots as any).days) {
        (data.course_slots as any).days = sortDays((data.course_slots as any).days);
      }
      if (data.selected_lab_days) {
        data.selected_lab_days = sortDays(data.selected_lab_days);
      }
      
      setEnrollment(data);
      fetchMaterials();
      fetchModules();
      fetchPyqs();
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

  const fetchPyqs = async () => {
    const { data, error } = await supabase
      .from('course_pyqs')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching PYQs:', error);
      return;
    }
    
    if (data) setPyqs(data);
  };

  const handlePyqUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Only PDF files are allowed',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPyq(true);

    try {
      const fileExt = 'pdf';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${courseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course_materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course_materials')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('course_pyqs')
        .insert({
          course_id: courseId,
          title: file.name.replace('.pdf', ''),
          file_url: publicUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'PYQ uploaded successfully',
      });

      fetchPyqs();
    } catch (error) {
      console.error('Error uploading PYQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload PYQ',
        variant: 'destructive',
      });
    } finally {
      setUploadingPyq(false);
      e.target.value = '';
    }
  };

  const handleDeletePyq = async (pyqId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/course_materials/')[1];
      if (filePath) {
        await supabase.storage.from('course_materials').remove([filePath]);
      }

      const { error } = await supabase
        .from('course_pyqs')
        .delete()
        .eq('id', pyqId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'PYQ deleted successfully',
      });

      fetchPyqs();
    } catch (error) {
      console.error('Error deleting PYQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete PYQ',
        variant: 'destructive',
      });
    }
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

      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'content' | 'pyqs')} className="w-full">
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
          <TabsTrigger value="pyqs">PYQs</TabsTrigger>
        </TabsList>
      </Tabs>

      {currentTab === 'content' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {modules.map((module) => {
          const moduleMaterials = materials
            .filter(m => m.module_id === module.id)
            .filter(m => searchQuery === '' || m.title.toLowerCase().includes(searchQuery.toLowerCase()));
          const isExpanded = expandedModule === module.id;
          
          // Skip rendering module if no materials match search
          if (searchQuery && moduleMaterials.length === 0) return null;
          
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
      )}

      {currentTab === 'pyqs' && (
        <div className="space-y-6">
          {userRole === 'admin' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Upload PYQ</h3>
                    <p className="text-sm text-muted-foreground">Add previous year question papers (PDF only)</p>
                  </div>
                  <Button asChild disabled={uploadingPyq}>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handlePyqUpload}
                        disabled={uploadingPyq}
                      />
                      {uploadingPyq ? 'Uploading...' : 'Upload PDF'}
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {pyqs.length > 0 ? (
              pyqs.map((pyq) => (
                <Card key={pyq.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-semibold">{pyq.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(pyq.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPreviewUrl(pyq.file_url);
                            setPreviewTitle(pyq.title);
                            setPreviewOpen(true);
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          asChild
                        >
                          <a href={pyq.file_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                        {userRole === 'admin' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePyq(pyq.id, pyq.file_url)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl mb-4 opacity-50">
                    <FileText className="h-20 w-20 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No PYQs available yet</h3>
                  <p className="text-muted-foreground">
                    {userRole === 'admin' ? 'Upload the first PYQ using the button above' : 'Check back later for previous year questions'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

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
        onOpenChange={(open) => {
          setShowDetailDialog(open);
          if (!open) {
            setCurrentTab('content');
          }
        }}
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
