import { TrendingUp } from 'lucide-react';

const Progress = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-success bg-clip-text text-transparent">
          Progress Tracking
        </h1>
        <p className="text-muted-foreground text-lg">
          Track your learning progress and achievements
        </p>
      </div>

      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <div className="p-8 bg-gradient-success rounded-full inline-block shadow-xl">
            <TrendingUp className="h-20 w-20 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-muted-foreground text-lg">
              Detailed progress analytics are being developed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
