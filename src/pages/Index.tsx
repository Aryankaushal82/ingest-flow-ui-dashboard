
import { useState } from 'react';
import IngestionForm from '../components/IngestionForm';
import StatusTracker from '../components/StatusTracker';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeView, setActiveView] = useState<'form' | 'status'>('form');
  const [currentIngestionId, setCurrentIngestionId] = useState<string>('');

  const handleIngestionSubmitted = (ingestionId: string) => {
    setCurrentIngestionId(ingestionId);
    setActiveView('status');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_theme(colors.blue.600/20%)_0%,_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_theme(colors.purple.600/20%)_0%,_transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Data Ingestion System
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Submit batch data processing jobs and monitor their real-time status with our powerful ingestion pipeline
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
            <Button
              variant={activeView === 'form' ? 'default' : 'ghost'}
              className={`mr-1 ${activeView === 'form' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}`}
              onClick={() => setActiveView('form')}
            >
              Submit Job
            </Button>
            <Button
              variant={activeView === 'status' ? 'default' : 'ghost'}
              className={activeView === 'status' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
              onClick={() => setActiveView('status')}
            >
              Track Status
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {activeView === 'form' ? (
            <IngestionForm onIngestionSubmitted={handleIngestionSubmitted} />
          ) : (
            <StatusTracker initialIngestionId={currentIngestionId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
