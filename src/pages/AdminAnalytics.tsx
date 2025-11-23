import { BarChart } from 'lucide-react';

const AdminAnalytics = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Analytics
        </h1>
        <p className="text-muted-foreground text-lg">
          View platform performance and insights
        </p>
      </div>

      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <div className="p-8 bg-gradient-success rounded-full inline-block shadow-xl">
            <BarChart className="h-20 w-20 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
            <p className="text-muted-foreground text-lg">
              Advanced analytics and reporting features are being developed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
