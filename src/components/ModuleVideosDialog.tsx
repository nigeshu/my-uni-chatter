import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      const searchQuery = `${module?.heading} ${topic}`;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-accent bg-clip-text text-transparent">
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
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-l-4 border-l-accent/40"
                      onClick={() => setSelectedVideo(video.id)}
                    >
                      <CardHeader className="p-0">
                        <div className="relative aspect-video">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
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
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleVideosDialog;
