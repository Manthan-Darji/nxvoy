import { format, differenceInDays } from 'date-fns';
import { MapPin, Calendar, DollarSign, Share2, Download, Edit, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Trip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: string | null;
}

interface ItineraryHeaderProps {
  trip: Trip;
  totalCost: number;
}

const ItineraryHeader = ({ trip, totalCost }: ItineraryHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const duration = trip.start_date && trip.end_date
    ? differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1
    : 0;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'Share this link with your travel buddies.',
      });
    } catch {
      toast({
        title: 'Share',
        description: url,
      });
    }
  };

  const handleExportPDF = () => {
    toast({
      title: 'Export PDF',
      description: 'PDF export coming soon!',
    });
  };

  const budgetProgress = trip.budget ? Math.min((totalCost / trip.budget) * 100, 100) : 0;
  const isOverBudget = trip.budget ? totalCost > trip.budget : false;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Trip Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-8 h-8" />
              <h1 className="text-2xl lg:text-3xl font-bold">
                {trip.destination} • {duration} Days
              </h1>
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 capitalize"
              >
                {trip.status || 'planned'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-white/90 text-sm">
              {trip.start_date && trip.end_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                </span>
              )}
              {trip.budget && (
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  Budget: ${trip.budget.toLocaleString()}
                </span>
              )}
            </div>

            {/* Budget Progress */}
            {trip.budget && (
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Spent: ${totalCost.toLocaleString()}</span>
                  <span className={isOverBudget ? 'text-red-200' : ''}>
                    {isOverBudget ? 'Over budget!' : `${Math.round(budgetProgress)}% of budget`}
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOverBudget ? 'bg-red-400' : 'bg-white'
                    }`}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-blue-600 hover:bg-white/90"
            >
              <Check className="w-4 h-4 mr-2" />
              Saved
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryHeader;
