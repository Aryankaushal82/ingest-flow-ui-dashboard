
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search, Clock, CheckCircle, Play, Loader2 } from 'lucide-react';

interface Batch {
  batch_id: string;
  ids: number[];
  status: 'yet_to_start' | 'triggered' | 'completed';
}

interface IngestionStatus {
  ingestion_id: string;
  status: 'yet_to_start' | 'triggered' | 'completed';
  batches: Batch[];
  priority?: string;
  created_at?: string;
}

interface StatusTrackerProps {
  initialIngestionId?: string;
}

const StatusTracker = ({ initialIngestionId = '' }: StatusTrackerProps) => {
  const [ingestionId, setIngestionId] = useState(initialIngestionId);
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchStatus = async () => {
    if (!ingestionId.trim()) {
      toast({
        title: "Ingestion ID Required",
        description: "Please enter an ingestion ID to track",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/status/${ingestionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ingestion job not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Fetch status error:', error);
      toast({
        title: "Failed to Fetch Status",
        description: error instanceof Error ? error.message : "Please check the ingestion ID and try again",
        variant: "destructive",
      });
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && ingestionId && status) {
      interval = setInterval(() => {
        fetchStatus();
      }, 3000); // Refresh every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, ingestionId, status]);

  // Load initial status if ingestionId is provided
  useEffect(() => {
    if (initialIngestionId) {
      fetchStatus();
    }
  }, [initialIngestionId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'triggered':
        return 'bg-yellow-500';
      case 'yet_to_start':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'triggered':
        return <Play className="h-4 w-4" />;
      case 'yet_to_start':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProgress = () => {
    if (!status?.batches.length) return 0;
    const completed = status.batches.filter(batch => batch.status === 'completed').length;
    return (completed / status.batches.length) * 100;
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress === 100) return 'bg-green-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl text-white">Track Ingestion Status</CardTitle>
          <CardDescription className="text-slate-300">
            Enter an ingestion ID to monitor the real-time status of your data processing job
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="ingestionId" className="text-white font-medium mb-2 block">
                Ingestion ID
              </Label>
              <Input
                id="ingestionId"
                placeholder="Enter ingestion ID (e.g., ing_123456)"
                value={ingestionId}
                onChange={(e) => setIngestionId(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={fetchStatus}
                disabled={isLoading || !ingestionId.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              {status && (
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? "default" : "outline"}
                  className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'border-white/20 text-white hover:bg-white/10'}
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>

          {lastUpdated && (
            <p className="text-xs text-slate-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {autoRefresh && <span className="ml-2">(Auto-refreshing)</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Display */}
      {status && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">Job Overview</CardTitle>
                <Badge className={`${getStatusColor(status.status)} text-white`}>
                  {getStatusIcon(status.status)}
                  <span className="ml-1">{status.status.replace('_', ' ').toUpperCase()}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Ingestion ID</p>
                  <p className="text-white font-mono text-lg">{status.ingestion_id}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Total Batches</p>
                  <p className="text-white font-bold text-lg">{status.batches.length}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Overall Progress</p>
                  <p className="text-white font-bold text-lg">{calculateProgress().toFixed(0)}%</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white">{status.batches.filter(b => b.status === 'completed').length} / {status.batches.length} batches completed</span>
                </div>
                <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getProgressColor()}`}
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch Details */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Batch Processing Details</CardTitle>
              <CardDescription className="text-slate-300">
                Real-time status of each processing batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {status.batches.map((batch, index) => (
                  <div
                    key={batch.batch_id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-white">
                          Batch {index + 1}
                        </div>
                        <Badge className={`${getStatusColor(batch.status)} text-white`}>
                          {getStatusIcon(batch.status)}
                          <span className="ml-1">{batch.status.replace('_', ' ').toUpperCase()}</span>
                        </Badge>
                      </div>
                      <span className="text-slate-400 text-sm font-mono">
                        {batch.batch_id}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Processing IDs:</p>
                      <div className="flex flex-wrap gap-2">
                        {batch.ids.map(id => (
                          <Badge key={id} variant="outline" className="border-white/20 text-white">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StatusTracker;
