import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface ModuleVideosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: {
    heading: string;
    topic: string;
  } | null;
}

const YOUTUBE_API_KEY = 'AIzaSyBEvlFCRamYfAssrTfy3yEwRZQfLBJFDfM';

const ModuleVideosDialog = ({ open, onOpenChange, module }: ModuleVideosDialogProps) => {
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [addToSpaceOpen, setAddToSpaceOpen] = useState(false);
  const [selectedVideoToAdd, setSelectedVideoToAdd] = useState<Video | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  const topics = module?.topic ? module.topic.split(/[–\-\n]/).map(t => t.trim()).filter(t => t.length > 10) : [];

  useEffect(() => {
    if (selectedTopic) {
      fetchVideos(selectedTopic);
    }
  }, [selectedTopic]);

  const fetchVideos = async (topic: string) => {
    setLoading(true);
    setVideos([]);
    setSelectedVideo(null);
    
    try {
      // Check cache first (24 hour expiry)
      const cacheKey = `youtube_videos_${topic}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isExpired) {
          setVideos(data);
          setLoading(false);
          return;
        }
      }
      
      // Use exact topic name for precise search results
      const searchQuery = topic;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=4&order=relevance&relevanceLanguage=en&videoDuration=medium&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      
      const videoResults: Video[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));
      
      // Cache the results
      localStorage.setItem(cacheKey, JSON.stringify({
        data: videoResults,
        timestamp: Date.now()
      }));
      
      setVideos(videoResults);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load videos. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTopic(null);
    setVideos([]);
    setSelectedVideo(null);
    onOpenChange(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('study_subjects')
      .select('*')
      .eq('student_id', user?.id);
    
    setSubjects(data || []);
  };

  const fetchCategories = async (subjectId: string) => {
    const { data } = await supabase
      .from('study_categories')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('category_type', 'videos');
    
    setCategories(data || []);
  };

  const handleAddToSpace = (video: Video, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVideoToAdd(video);
    fetchSubjects();
    setAddToSpaceOpen(true);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedCategory('');
    if (value) {
      fetchCategories(value);
    }
  };

  const saveToSpace = async () => {
    if (!selectedVideoToAdd) return;

    let categoryId = selectedCategory;

    // Create new category if needed
    if (showNewCategory && newCategoryName.trim()) {
      const { data, error } = await supabase
        .from('study_categories')
        .insert({
          subject_id: selectedSubject,
          name: newCategoryName.trim(),
          category_type: 'videos',
        })
        .select()
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create category',
          variant: 'destructive',
        });
        return;
      }

      categoryId = data.id;
    }

    if (!categoryId) {
      toast({
        title: 'Error',
        description: 'Please select or create a category',
        variant: 'destructive',
      });
      return;
    }

    // Save video
    const { error } = await supabase.from('study_items').insert({
      category_id: categoryId,
      title: selectedVideoToAdd.title,
      youtube_url: `https://www.youtube.com/watch?v=${selectedVideoToAdd.id}`,
      video_source: 'course',
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add video to space',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Video added to your space!',
    });

    setAddToSpaceOpen(false);
    setSelectedVideoToAdd(null);
    setSelectedSubject('');
    setSelectedCategory('');
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {module?.heading} - Videos
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 h-full overflow-hidden">
          {/* Topics Sidebar */}
          <div className="w-1/3 border-r pr-4">
            <h3 className="text-lg font-semibold mb-4">Topics</h3>
            <ScrollArea className="h-[calc(80vh-120px)]">
              <div className="space-y-2">
                {topics.map((topic, index) => (
                  <Button
                    key={index}
                    variant={selectedTopic === topic ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <span className="line-clamp-2">{topic}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Videos Section */}
          <div className="flex-1 overflow-hidden">
            {!selectedTopic ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a topic to view related videos
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedVideo ? (
              <div className="space-y-4 h-full flex flex-col">
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${selectedVideo}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <Button variant="outline" onClick={() => setSelectedVideo(null)}>
                  Back to video list
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 gap-4 pr-4">
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/40 relative group"
                    >
                      <div onClick={() => setSelectedVideo(video.id)}>
                        <CardHeader className="p-0">
                          <div className="relative aspect-video">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="h-12 w-12 text-white" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3">
                          <CardTitle className="text-sm line-clamp-2 mb-1">
                            {video.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                        </CardContent>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => handleAddToSpace(video, e)}
                        title="Add to My Space"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Add to Space Dialog */}
      <Dialog open={addToSpaceOpen} onOpenChange={setAddToSpaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video to My Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Do you want to add "{selectedVideoToAdd?.title}" to your space?
            </p>

            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubject && (
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setShowNewCategory(true);
                      setSelectedCategory('');
                    } else {
                      setShowNewCategory(false);
                      setSelectedCategory(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">
                      <span className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create New Category
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showNewCategory && (
              <div className="space-y-2">
                <Label>New Category Name</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={saveToSpace} className="flex-1" disabled={!selectedSubject}>
                Add to Space
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAddToSpaceOpen(false);
                  setSelectedVideoToAdd(null);
                  setSelectedSubject('');
                  setSelectedCategory('');
                  setNewCategoryName('');
                  setShowNewCategory(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default ModuleVideosDialog;
