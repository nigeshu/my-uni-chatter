import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, FileText, Video, Trash2, FolderPlus, Info, Play } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  category_type: 'notes' | 'videos';
}

interface StudyItem {
  id: string;
  title: string;
  content: string | null;
  file_url: string | null;
  youtube_url: string | null;
}

export const NotesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<StudyItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [newSubjectOpen, setNewSubjectOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'notes' | 'videos'>('notes');
  
  // Remove manual item creation - students can only add from courses

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  useEffect(() => {
    if (selectedSubject) {
      fetchCategories();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedCategory) {
      fetchItems();
    }
  }, [selectedCategory]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('study_subjects')
      .select('*')
      .eq('student_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubjects(data);
    }
  };

  const fetchCategories = async () => {
    if (!selectedSubject) return;

    const { data, error } = await supabase
      .from('study_categories')
      .select('*')
      .eq('subject_id', selectedSubject.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCategories(data as Category[]);
    }
  };

  const fetchItems = async () => {
    if (!selectedCategory) return;

    const { data, error } = await supabase
      .from('study_items')
      .select('*')
      .eq('category_id', selectedCategory.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data);
    }
  };

  const createSubject = async () => {
    if (!subjectName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject name',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('study_subjects').insert({
      student_id: user?.id,
      name: subjectName.trim(),
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create subject',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Subject created successfully',
    });

    setNewSubjectOpen(false);
    setSubjectName('');
    fetchSubjects();
  };

  const createCategory = async () => {
    if (!categoryName.trim() || !selectedSubject) {
      toast({
        title: 'Error',
        description: 'Please enter a category name',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('study_categories').insert({
      subject_id: selectedSubject.id,
      name: categoryName.trim(),
      category_type: categoryType,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Category created successfully',
    });

    setNewCategoryOpen(false);
    setCategoryName('');
    fetchCategories();
  };

  // Manual creation removed - students can only add from courses

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('study_items').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Item deleted successfully',
    });

    fetchItems();
  };

  const deleteSubject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when deleting
    
    const { error } = await supabase.from('study_subjects').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subject',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Subject deleted successfully',
    });

    if (selectedSubject?.id === id) {
      setSelectedSubject(null);
    }
    fetchSubjects();
  };

  const deleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when deleting
    
    const { error } = await supabase.from('study_categories').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Category deleted successfully',
    });

    if (selectedCategory?.id === id) {
      setSelectedCategory(null);
    }
    fetchCategories();
  };

  if (!selectedSubject) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Study Notes & Videos</h2>
          <Dialog open={newSubjectOpen} onOpenChange={setNewSubjectOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Name</Label>
                  <Input
                    id="subject"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="e.g., Mathematics, Physics..."
                  />
                </div>
                <Button onClick={createSubject} className="w-full">
                  Create Subject
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary relative group"
              onClick={() => setSelectedSubject(subject)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => deleteSubject(subject.id, e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{subject.name}</h3>
              </div>
            </Card>
          ))}
        </div>

        {subjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No subjects yet. Create your first subject!</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setSelectedSubject(null)}>
          ← Back
        </Button>
        <h2 className="text-2xl font-bold">{selectedSubject.name}</h2>
      </div>

      <Tabs defaultValue="notes" className="w-full" onValueChange={(v) => setCategoryType(v as 'notes' | 'videos')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Categories</h3>
            <Dialog open={newCategoryOpen && categoryType === 'notes'} onOpenChange={setNewCategoryOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={() => setCategoryType('notes')}>
                  <FolderPlus className="h-4 w-4" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="e.g., Lecture Notes, Assignments..."
                    />
                  </div>
                  <Button onClick={createCategory} className="w-full">
                    Create Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.filter(c => c.category_type === 'notes').map((category) => (
              <Card
                key={category.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105 relative group"
                onClick={() => setSelectedCategory(category)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => deleteCategory(category.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">{category.name}</span>
                </div>
              </Card>
            ))}
          </div>

          {selectedCategory && selectedCategory.category_type === 'notes' && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">{selectedCategory.name}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCategory(null)}
                >
                  Close
                </Button>
              </div>
              
              {items.length === 0 && (
                <Card className="p-6 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium">Add materials from Courses</p>
                      <p className="text-sm text-muted-foreground">
                        Go to Courses → select a course → click on materials and use the "Add to Space" option to save them here.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold">{item.title}</h5>
                        {item.content && (
                          <p className="text-sm text-muted-foreground mt-2">{item.content}</p>
                        )}
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline mt-2 inline-block"
                          >
                            View Attachment
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Video Categories</h3>
            <Dialog open={newCategoryOpen && categoryType === 'videos'} onOpenChange={setNewCategoryOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={() => setCategoryType('videos')}>
                  <FolderPlus className="h-4 w-4" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Category Name</Label>
                    <Input
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="e.g., Tutorials, Lectures..."
                    />
                  </div>
                  <Button onClick={createCategory} className="w-full">
                    Create Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-4 min-h-[500px]">
            {/* Categories Sidebar */}
            <div className="w-1/3 border-r pr-4">
              <div className="space-y-2">
                {categories.filter(c => c.category_type === 'videos').map((category) => (
                  <div key={category.id} className="relative group">
                    <Button
                      variant={selectedCategory?.id === category.id ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-3 px-4 pr-10"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <Video className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="line-clamp-2">{category.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 -translate-y-1/2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"
                      onClick={(e) => deleteCategory(category.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {categories.filter(c => c.category_type === 'videos').length === 0 && (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No categories yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Videos Section */}
            <div className="flex-1">
              {!selectedCategory ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p>Select a category to view videos</p>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <Card className="p-6 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium">Add videos from Courses</p>
                      <p className="text-sm text-muted-foreground">
                        Go to Courses → select a course → click on module videos and use the "Add to Space" option to save them here.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {items.map((item) => {
                    // Extract video ID from YouTube URL
                    const videoId = item.youtube_url?.includes('v=') 
                      ? item.youtube_url.split('v=')[1]?.split('&')[0]
                      : item.youtube_url?.split('/').pop();
                    
                    const thumbnailUrl = videoId 
                      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                      : '';
                    
                    return (
                      <Card
                        key={item.id}
                        className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/40 relative group overflow-hidden"
                      >
                        <div className="relative aspect-video bg-black cursor-pointer">
                          {thumbnailUrl && (
                            <>
                              <img
                                src={thumbnailUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                  href={`https://www.youtube.com/watch?v=${videoId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Play className="h-6 w-6 text-primary" />
                                </a>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="p-3">
                          <h5 className="font-semibold text-sm line-clamp-2 mb-2">{item.title}</h5>
                          <div className="flex items-center justify-between">
                            <a
                              href={`https://www.youtube.com/watch?v=${videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Watch on YouTube
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:text-destructive h-8 w-8 p-0"
                              onClick={() => deleteItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
