import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, FileText, Link, Video, File, List, Download, GripVertical } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseDetailDialog from '@/components/CourseDetailDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
}

const AdminCourseMaterials = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    material_type: 'document',
    module_id: 'none',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [moduleFormData, setModuleFormData] = useState({
    serial_no: '',
    topic: '',
    heading: '',
  });

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchMaterials();
      fetchModules();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (data) {
      setCourse(data);
      setSelectedCourse(data);
    }
  };

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (data) setMaterials(data);
  };

  const fetchModules = async () => {
    const { data } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (data) setModules(data);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return null;
    
    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${courseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course_materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course_materials')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileUrl = formData.file_url;
      
      // Upload file if selected
      if (selectedFile) {
        const uploadedUrl = await handleFileUpload(selectedFile);
        if (uploadedUrl) {
          fileUrl = uploadedUrl;
        }
      }

      const materialData = {
        title: formData.title,
        description: formData.description,
        file_url: fileUrl,
        material_type: formData.material_type,
        module_id: formData.module_id || null,
      };

      if (editingMaterial) {
        const { error } = await supabase
          .from('course_materials')
          .update(materialData)
          .eq('id', editingMaterial.id);
        if (error) throw error;
        toast({ title: 'Success!', description: 'Material updated successfully.' });
      } else {
        const { error } = await supabase.from('course_materials').insert({
          ...materialData,
          course_id: courseId,
          order_index: materials.length,
        });
        if (error) throw error;
        toast({ title: 'Success!', description: 'Material added successfully.' });
      }

      setShowDialog(false);
      setEditingMaterial(null);
      setSelectedFile(null);
      setFormData({ title: '', description: '', file_url: '', material_type: 'document', module_id: 'none' });
      fetchMaterials();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save material.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      file_url: material.file_url || '',
      material_type: material.material_type,
      module_id: material.module_id || 'none',
    });
    setShowDialog(true);
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    const { error } = await supabase.from('course_materials').delete().eq('id', materialId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete material.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Material deleted successfully.' });
      fetchMaterials();
    }
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingModule) {
        const { error } = await supabase
          .from('course_modules')
          .update(moduleFormData)
          .eq('id', editingModule.id);
        if (error) throw error;
        toast({ title: 'Success!', description: 'Module updated successfully.' });
      } else {
        const { error } = await supabase.from('course_modules').insert({
          ...moduleFormData,
          course_id: courseId,
          order_index: modules.length,
        });
        if (error) throw error;
        toast({ title: 'Success!', description: 'Module added successfully.' });
      }

      setShowModuleDialog(false);
      setEditingModule(null);
      setModuleFormData({ serial_no: '', topic: '', heading: '' });
      fetchModules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save module.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleFormData({
      serial_no: module.serial_no,
      topic: module.topic,
      heading: module.heading || '',
    });
    setShowModuleDialog(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    const { error } = await supabase.from('course_modules').delete().eq('id', moduleId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete module.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Module deleted successfully.' });
      fetchModules();
    }
  };

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);

    const reorderedModules = arrayMove(modules, oldIndex, newIndex);
    setModules(reorderedModules);

    // Update order_index in database
    const updates = reorderedModules.map((module, index) => ({
      id: module.id,
      order_index: index,
    }));

    for (const update of updates) {
      await supabase
        .from('course_modules')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    toast({ title: 'Success', description: 'Module order updated.' });
  };

  const handleMaterialDragEnd = async (event: DragEndEvent, moduleId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const moduleMaterials = materials.filter((m) => m.module_id === moduleId);
    const oldIndex = moduleMaterials.findIndex((m) => m.id === active.id);
    const newIndex = moduleMaterials.findIndex((m) => m.id === over.id);

    const reorderedMaterials = arrayMove(moduleMaterials, oldIndex, newIndex);

    // Update local state
    const otherMaterials = materials.filter((m) => m.module_id !== moduleId);
    const newMaterials = [...otherMaterials, ...reorderedMaterials].sort((a, b) => {
      if (a.module_id === b.module_id) {
        return reorderedMaterials.findIndex((m) => m.id === a.id) - reorderedMaterials.findIndex((m) => m.id === b.id);
      }
      return 0;
    });
    setMaterials(newMaterials);

    // Update order_index in database
    const updates = reorderedMaterials.map((material, index) => ({
      id: material.id,
      order_index: index,
    }));

    for (const update of updates) {
      await supabase
        .from('course_materials')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    toast({ title: 'Success', description: 'Material order updated.' });
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'file': return <File className="h-5 w-5" />;
      case 'link': return <Link className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              {course?.title}
            </h1>
            <p className="text-muted-foreground text-lg">Course Management</p>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="bg-gradient-accent hover:opacity-90"
              onClick={() => {
                setEditingMaterial(null);
                setFormData({ title: '', description: '', file_url: '', material_type: 'document', module_id: 'none' });
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Material title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Material description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Material Type</Label>
                <Select
                  value={formData.material_type}
                  onValueChange={(value) => setFormData({ ...formData, material_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
                <div className="text-sm text-muted-foreground mt-2">Or</div>
                <Label htmlFor="file_url">File URL</Label>
                <Input
                  id="file_url"
                  placeholder="https://..."
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="module">Module (Optional)</Label>
                <Select
                  value={formData.module_id}
                  onValueChange={(value) => setFormData({ ...formData, module_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Module</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.heading ? `${module.heading} - ` : ''}{module.serial_no} - {module.topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading || uploadingFile} className="flex-1 bg-gradient-accent hover:opacity-90">
                  {uploadingFile ? 'Uploading...' : loading ? 'Saving...' : editingMaterial ? 'Update Material' : 'Add Material'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="course" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger 
            value="course" 
            onClick={() => {
              setSelectedCourse(course);
              setShowDetailDialog(true);
            }}
          >
            Course Page
          </TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Modules Section */}
      <Card className="mb-8">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <List className="h-6 w-6 text-primary" />
              Course Modules
            </CardTitle>
            <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-accent hover:opacity-90"
                onClick={() => {
                  setEditingModule(null);
                  setModuleFormData({ serial_no: '', topic: '', heading: '' });
                }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleModuleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="heading">Module Heading</Label>
                    <Input
                      id="heading"
                      placeholder="e.g., Introduction, Advanced Topics"
                      value={moduleFormData.heading}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, heading: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serial_no">Module S.No *</Label>
                    <Input
                      id="serial_no"
                      placeholder="e.g., 1.1, Module 1"
                      value={moduleFormData.serial_no}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, serial_no: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic *</Label>
                    <Textarea
                      id="topic"
                      placeholder="Module topic or title"
                      value={moduleFormData.topic}
                      onChange={(e) => setModuleFormData({ ...moduleFormData, topic: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1 bg-gradient-accent hover:opacity-90">
                      {loading ? 'Saving...' : editingModule ? 'Update Module' : 'Add Module'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowModuleDialog(false)} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {modules.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleModuleDragEnd}
            >
              <SortableContext
                items={modules.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-3">
                  {modules.map((module) => (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      onEdit={handleEditModule}
                      onDelete={handleDeleteModule}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="py-12 text-center">
              <List className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No modules added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials/Content Section */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Course Content
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Materials grouped by module */}
          {modules.map((module) => {
            const moduleMaterials = materials.filter(m => m.module_id === module.id);
            if (moduleMaterials.length === 0) return null;
            
            return (
              <div key={module.id} className="mb-8 last:mb-0">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                  <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-white">{module.serial_no}</span>
                  </div>
                  <div className="flex-1">
                    {module.heading && (
                      <h3 className="text-lg font-semibold">{module.heading}</h3>
                    )}
                  </div>
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleMaterialDragEnd(event, module.id)}
                >
                  <SortableContext
                    items={moduleMaterials.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {moduleMaterials.map((material) => (
                        <SortableMaterialItem
                          key={material.id}
                          material={material}
                          getMaterialIcon={getMaterialIcon}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onPreview={(url, title) => {
                            setPreviewUrl(url);
                            setPreviewTitle(title);
                            setPreviewOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}

          {materials.length === 0 && (
            <div className="text-center py-16">
              <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl mb-4 opacity-50">
                <FileText className="h-20 w-20 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No materials yet</h3>
              <p className="text-muted-foreground mb-6">Add your first course material to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

// Sortable Module Item Component
const SortableModuleItem = ({
  module,
  onEdit,
  onDelete,
}: {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 flex-1">
            <button
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <span className="font-bold text-primary text-lg min-w-[4rem]">{module.serial_no}</span>
            <span className="text-foreground">{module.topic}</span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={() => onEdit(module)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(module.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

// Sortable Material Item Component
const SortableMaterialItem = ({
  material,
  getMaterialIcon,
  onEdit,
  onDelete,
  onPreview,
}: {
  material: Material;
  getMaterialIcon: (type: string) => JSX.Element;
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
  onPreview: (url: string | null, title: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: material.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            {getMaterialIcon(material.material_type)}
            <div>
              <CardTitle className="text-lg">{material.title}</CardTitle>
              <p className="text-sm text-muted-foreground capitalize">{material.material_type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(material)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(material.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {(material.description || material.file_url) && (
        <CardContent>
          {material.description && (
            <p className="text-sm text-muted-foreground mb-2">{material.description}</p>
          )}
          {material.file_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(material.file_url, material.title)}
              className="mt-2"
            >
              <FileText className="h-3 w-3 mr-2" />
              Preview &amp; Download
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AdminCourseMaterials;
