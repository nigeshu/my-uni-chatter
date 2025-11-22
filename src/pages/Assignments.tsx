import { BookOpen } from 'lucide-react';

const Assignments = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-accent bg-clip-text text-transparent">
          Assignments
        </h1>
        <p className="text-muted-foreground text-lg">
          View and complete your assignments
        </p>
      </div>

      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <div className="p-8 bg-gradient-accent rounded-full inline-block shadow-xl">
            <BookOpen className="h-20 w-20 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-muted-foreground text-lg">
              Assignment management features are being developed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
