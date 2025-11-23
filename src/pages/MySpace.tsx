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
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
        color: item.color,
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
  };

  const handleConnect = (itemId: string) => {
    if (connectingFrom === null) {
      setConnectingFrom(itemId);
    } else if (connectingFrom !== itemId) {
      createConnection(connectingFrom, itemId);
      setConnectingFrom(null);
    }
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
        onMouseMove={handleMouseMove}
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

            const x1 = fromItem.position_x + fromItem.width / 2;
            const y1 = fromItem.position_y + fromItem.height / 2;
            const x2 = toItem.position_x + toItem.width / 2;
            const y2 = toItem.position_y + toItem.height / 2;

            return (
              <line
                key={conn.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
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
              minHeight: item.height,
              zIndex: 10,
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getIconForType(item.item_type)}
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                </div>
                <div className="flex items-center gap-1 no-drag">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleConnect(item.id)}
                  >
                    <LinkIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-destructive"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {item.content && (
                <p className="text-xs text-muted-foreground line-clamp-4">
                  {item.content}
                </p>
              )}

              <Badge variant="outline" className="text-xs">
                {item.item_type}
              </Badge>
            </div>
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
