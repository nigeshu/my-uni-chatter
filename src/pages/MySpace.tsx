import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  StickyNote,
  FileText,
  Link as LinkIcon,
  Upload,
  Trash2,
  Move,
  X,
  Save,
  CheckSquare,
  Target,
  ListTodo,
  Bell,
  Code,
  Minimize2,
  Maximize2,
  File,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkspaceItem {
  id: string;
  item_type: string;
  title: string;
  content: string | null;
  file_url: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  color: string;
  is_minimized: boolean;
}

interface Connection {
  id: string;
  from_item_id: string;
  to_item_id: string;
}

const MySpace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WorkspaceItem | null>(null);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newItemType, setNewItemType] = useState('note');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemColor, setNewItemColor] = useState('primary');
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [uploadingFile, setUploadingFile] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchConnections();
    }
  }, [user]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('workspace_items')
      .select('*')
      .eq('student_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workspace items',
        variant: 'destructive',
      });
      return;
    }

    setItems(data || []);
  };

  const fetchConnections = async () => {
    const { data, error } = await supabase
      .from('workspace_connections')
      .select('*')
      .eq('student_id', user?.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load connections',
        variant: 'destructive',
      });
      return;
    }

    setConnections(data || []);
  };

  const createItem = async () => {
    if (!newItemTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('workspace_items').insert({
      student_id: user?.id,
      item_type: newItemType,
      title: newItemTitle,
      content: newItemContent,
      color: newItemColor,
      position_x: 100,
      position_y: 100,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create item',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Item created successfully',
    });

    setNewItemOpen(false);
    setNewItemTitle('');
    setNewItemContent('');
    fetchItems();
  };

  const updateItem = async (item: WorkspaceItem) => {
    const { error } = await supabase
      .from('workspace_items')
      .update({
        title: item.title,
        content: item.content,
        position_x: item.position_x,
        position_y: item.position_y,
        width: item.width,
        height: item.height,
        color: item.color,
        is_minimized: item.is_minimized,
      })
      .eq('id', item.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('workspace_items').delete().eq('id', id);

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
    fetchConnections();
  };

  const createConnection = async (fromId: string, toId: string) => {
    const { error } = await supabase.from('workspace_connections').insert({
      student_id: user?.id,
      from_item_id: fromId,
      to_item_id: toId,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create connection',
        variant: 'destructive',
      });
      return;
    }

    fetchConnections();
  };

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setDraggedItem(itemId);
    setDragOffset({
      x: e.clientX - item.position_x,
      y: e.clientY - item.position_y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItem) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setItems((prev) =>
      prev.map((item) =>
        item.id === draggedItem ? { ...item, position_x: newX, position_y: newY } : item
      )
    );
  };

  const handleMouseUp = () => {
    if (draggedItem) {
      const item = items.find((i) => i.id === draggedItem);
      if (item) {
        updateItem(item);
      }
      setDraggedItem(null);
    }
    if (resizingItem) {
      const item = items.find((i) => i.id === resizingItem);
      if (item) {
        updateItem(item);
      }
      setResizingItem(null);
    }
  };

  const handleConnect = (itemId: string) => {
    if (connectingFrom === null) {
      setConnectingFrom(itemId);
    } else if (connectingFrom !== itemId) {
      createConnection(connectingFrom, itemId);
      setConnectingFrom(null);
    }
  };

  const handleResizeStart = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setResizingItem(itemId);
    setResizeStart({
      width: item.width,
      height: item.height,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizingItem) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    setItems((prev) =>
      prev.map((item) =>
        item.id === resizingItem
          ? {
              ...item,
              width: Math.max(200, resizeStart.width + deltaX),
              height: Math.max(150, resizeStart.height + deltaY),
            }
          : item
      )
    );
  };

  const toggleMinimize = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const updatedItem = { ...item, is_minimized: !item.is_minimized };
    setItems((prev) => prev.map((i) => (i.id === itemId ? updatedItem : i)));
    updateItem(updatedItem);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 20MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingFile(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${user?.id}/${itemId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('workspace-files')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
      setUploadingFile(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('workspace-files')
      .getPublicUrl(filePath);

    const item = items.find((i) => i.id === itemId);
    if (item) {
      const updatedItem = { ...item, file_url: urlData.publicUrl };
      setItems((prev) => prev.map((i) => (i.id === itemId ? updatedItem : i)));
      
      const { error } = await supabase
        .from('workspace_items')
        .update({ file_url: urlData.publicUrl })
        .eq('id', itemId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to save file reference',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'File uploaded successfully',
        });
      }
    }

    setUploadingFile(false);
  };

  const getEdgePoint = (item: WorkspaceItem, targetItem: WorkspaceItem) => {
    const centerX = item.position_x + item.width / 2;
    const centerY = item.position_y + item.height / 2;
    const targetCenterX = targetItem.position_x + targetItem.width / 2;
    const targetCenterY = targetItem.position_y + targetItem.height / 2;

    const dx = targetCenterX - centerX;
    const dy = targetCenterY - centerY;

    const angle = Math.atan2(dy, dx);

    let x, y;
    if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
      // Horizontal edge
      if (dx > 0) {
        x = item.position_x + item.width;
        y = centerY + Math.tan(angle) * (item.width / 2);
      } else {
        x = item.position_x;
        y = centerY - Math.tan(angle) * (item.width / 2);
      }
    } else {
      // Vertical edge
      if (dy > 0) {
        y = item.position_y + item.height;
        x = centerX + (item.height / 2) / Math.tan(angle);
      } else {
        y = item.position_y;
        x = centerX - (item.height / 2) / Math.tan(angle);
      }
    }

    return { x, y };
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      primary: 'bg-primary/10 border-primary',
      accent: 'bg-accent/10 border-accent',
      success: 'bg-success/10 border-success',
      warning: 'bg-warning/10 border-warning',
      destructive: 'bg-destructive/10 border-destructive',
      purple: 'bg-purple-500/10 border-purple-500',
      pink: 'bg-pink-500/10 border-pink-500',
      orange: 'bg-orange-500/10 border-orange-500',
      blue: 'bg-blue-500/10 border-blue-500',
      green: 'bg-green-500/10 border-green-500',
    };
    return colors[color] || colors.primary;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'plan':
        return <FileText className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      case 'todo':
        return <CheckSquare className="h-4 w-4" />;
      case 'goal':
        return <Target className="h-4 w-4" />;
      case 'task':
        return <ListTodo className="h-4 w-4" />;
      case 'reminder':
        return <Bell className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      default:
        return <StickyNote className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 animate-fade-in">
      <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              My Space
            </h1>
            <p className="text-muted-foreground mt-1">
              Create your personalized study workspace
            </p>
          </div>

          <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newItemType} onValueChange={setNewItemType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">📝 Note</SelectItem>
                      <SelectItem value="plan">📋 Plan</SelectItem>
                      <SelectItem value="todo">✅ Todo List</SelectItem>
                      <SelectItem value="goal">🎯 Goal</SelectItem>
                      <SelectItem value="task">📌 Task</SelectItem>
                      <SelectItem value="reminder">🔔 Reminder</SelectItem>
                      <SelectItem value="code">💻 Code Snippet</SelectItem>
                      <SelectItem value="link">🔗 Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Enter title..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    placeholder="Enter content..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <Select value={newItemColor} onValueChange={setNewItemColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">🔵 Primary Blue</SelectItem>
                      <SelectItem value="accent">💜 Accent Purple</SelectItem>
                      <SelectItem value="success">✅ Success Green</SelectItem>
                      <SelectItem value="warning">⚠️ Warning Yellow</SelectItem>
                      <SelectItem value="destructive">🔴 Red</SelectItem>
                      <SelectItem value="purple">💜 Purple</SelectItem>
                      <SelectItem value="pink">💗 Pink</SelectItem>
                      <SelectItem value="orange">🧡 Orange</SelectItem>
                      <SelectItem value="blue">💙 Blue</SelectItem>
                      <SelectItem value="green">💚 Green</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={createItem} className="w-full">
                  Create Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative w-full h-[calc(100vh-120px)] cursor-move"
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleResizeMove(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible', zIndex: 0 }}
        >
          {connections.map((conn) => {
            const fromItem = items.find((i) => i.id === conn.from_item_id);
            const toItem = items.find((i) => i.id === conn.to_item_id);
            if (!fromItem || !toItem) return null;

            const fromPoint = getEdgePoint(fromItem, toItem);
            const toPoint = getEdgePoint(toItem, fromItem);

            return (
              <line
                key={conn.id}
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.5"
              />
            );
          })}
        </svg>

        {items.map((item) => (
          <Card
            key={item.id}
            className={`absolute cursor-move transition-shadow hover:shadow-xl bg-card ${getColorClass(
              item.color
            )} border-2 ${connectingFrom === item.id ? 'ring-4 ring-primary' : ''}`}
            style={{
              left: item.position_x,
              top: item.position_y,
              width: item.width,
              minHeight: item.is_minimized ? 'auto' : item.height,
              zIndex: 10,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getIconForType(item.item_type)}
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                </div>
                <div className="flex items-center gap-1 no-drag flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleMinimize(item.id)}
                    title={item.is_minimized ? 'Maximize' : 'Minimize'}
                  >
                    {item.is_minimized ? (
                      <Maximize2 className="h-3 w-3" />
                    ) : (
                      <Minimize2 className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleConnect(item.id)}
                    title="Connect to another item"
                  >
                    <LinkIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload file"
                    disabled={uploadingFile}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, item.id)}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-destructive"
                    onClick={() => deleteItem(item.id)}
                    title="Delete item"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {!item.is_minimized && (
                <>
                  {item.file_url && (
                    <div className="mt-2 p-2 bg-muted rounded border">
                      {item.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={item.file_url}
                          alt="Uploaded file"
                          className="max-w-full h-auto rounded"
                        />
                      ) : item.file_url.match(/\.pdf$/i) ? (
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View PDF
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View File
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {item.content && (
                    <p className="text-xs text-muted-foreground line-clamp-4">
                      {item.content}
                    </p>
                  )}

                  <Badge variant="outline" className="text-xs">
                    {item.item_type}
                  </Badge>
                </>
              )}
            </div>

            {!item.is_minimized && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize no-drag bg-primary/20 hover:bg-primary/40 rounded-tl"
                onMouseDown={(e) => handleResizeStart(e, item.id)}
                title="Drag to resize"
              />
            )}
          </Card>
        ))}

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <StickyNote className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Your workspace is empty</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Create notes, plans, and organize your study materials
                </p>
              </div>
              <Button onClick={() => setNewItemOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Item
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySpace;
