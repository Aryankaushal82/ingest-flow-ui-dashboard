
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface IngestionFormProps {
  onIngestionSubmitted: (ingestionId: string) => void;
}

const IngestionForm = ({ onIngestionSubmitted }: IngestionFormProps) => {
  const [idsInput, setIdsInput] = useState('');
  const [priority, setPriority] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validateIds = (input: string): { isValid: boolean; ids: number[]; errors: string[] } => {
    const errors: string[] = [];
    let ids: number[] = [];

    if (!input.trim()) {
      errors.push('IDs are required');
      return { isValid: false, ids: [], errors };
    }

    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        ids = parsed;
      } else {
        errors.push('Input must be a valid JSON array');
        return { isValid: false, ids: [], errors };
      }
    } catch {
      // If JSON parsing fails, try comma-separated values
      try {
        ids = input.split(',').map(id => {
          const num = parseInt(id.trim());
          if (isNaN(num)) {
            throw new Error(`"${id.trim()}" is not a valid number`);
          }
          return num;
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Invalid ID format');
        return { isValid: false, ids: [], errors };
      }
    }

    // Validate that all IDs are positive integers
    for (const id of ids) {
      if (!Number.isInteger(id) || id <= 0) {
        errors.push(`ID "${id}" must be a positive integer`);
      }
    }

    // Check for duplicates
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length !== ids.length) {
      errors.push('Duplicate IDs are not allowed');
    }

    if (ids.length === 0) {
      errors.push('At least one ID is required');
    }

    if (ids.length > 100) {
      errors.push('Maximum 100 IDs allowed per job');
    }

    return { isValid: errors.length === 0, ids, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateIds(idsInput);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!priority) {
      toast({
        title: "Priority Required",
        description: "Please select a priority level",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call - replace with actual endpoint
      const response = await fetch('http://localhost:5000/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: validation.ids,
          priority: priority
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      toast({
        title: "Job Submitted Successfully!",
        description: `Ingestion ID: ${data.ingestion_id}`,
      });

      onIngestionSubmitted(data.ingestion_id);
      
      // Reset form
      setIdsInput('');
      setPriority('');
      setValidationErrors([]);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit ingestion job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validation = validateIds(idsInput);
  const hasErrors = validation.errors.length > 0 && idsInput.trim() !== '';

  return (
    <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Submit Ingestion Job</CardTitle>
        <CardDescription className="text-slate-300">
          Enter the IDs you want to process and select a priority level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IDs Input */}
          <div className="space-y-2">
            <Label htmlFor="ids" className="text-white font-medium">
              IDs to Process
            </Label>
            <Textarea
              id="ids"
              placeholder="Enter IDs as JSON array: [1, 2, 3, 4] or comma-separated: 1, 2, 3, 4"
              value={idsInput}
              onChange={(e) => setIdsInput(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 min-h-[100px] focus:border-blue-400 focus:ring-blue-400"
            />
            
            {/* Real-time validation feedback */}
            {idsInput.trim() && (
              <div className="flex items-center gap-2 mt-2">
                {hasErrors ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                <span className={`text-sm ${hasErrors ? 'text-red-400' : 'text-green-400'}`}>
                  {hasErrors ? 'Invalid format' : `${validation.ids.length} valid IDs detected`}
                </span>
              </div>
            )}

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <h4 className="text-red-400 font-medium mb-2">Validation Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-red-300 text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-white font-medium">
              Priority Level
            </Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="HIGH" className="text-white hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500">HIGH</Badge>
                    <span>Process immediately</span>
                  </div>
                </SelectItem>
                <SelectItem value="MEDIUM" className="text-white hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">MEDIUM</Badge>
                    <span>Standard processing</span>
                  </div>
                </SelectItem>
                <SelectItem value="LOW" className="text-white hover:bg-slate-700">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">LOW</Badge>
                    <span>Process when resources available</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting || hasErrors || !priority || !idsInput.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Job...
              </>
            ) : (
              'Submit Ingestion Job'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default IngestionForm;
