import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Maintenance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="max-w-2xl w-full border-0 shadow-2xl">
        <CardContent className="p-12 text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping opacity-20">
              <Construction className="h-24 w-24 mx-auto text-warning" />
            </div>
            <Construction className="h-24 w-24 mx-auto text-warning relative" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              🚧 Under Maintenance 🚧
            </h1>
            <p className="text-xl text-muted-foreground">
              Oops! We're sprucing things up!
            </p>
          </div>

          <div className="space-y-2 text-muted-foreground">
            <p className="text-lg">
              Our team of digital wizards is currently working their magic ✨
            </p>
            <p>
              We're adding some awesome new features and making things even better for you!
            </p>
            <p className="text-sm pt-4">
              Don't worry, we'll be back before you can say "learning is fun!" 🎓
            </p>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Thank you for your patience! 💙
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;
