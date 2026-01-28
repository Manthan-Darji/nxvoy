import { format, differenceInDays, addDays } from 'date-fns';
import { MapPin, Calendar, DollarSign, Share2, Download, Printer, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface Activity {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  estimatedCost: number;
  category: string;
}

interface DayData {
  day: number;
  activities: Activity[];
}

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
  days?: DayData[];
}

const ItineraryHeader = ({ trip, totalCost, days = [] }: ItineraryHeaderProps) => {
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
        title: 'Link copied! 🎒',
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Helper function to add new page if needed
    const checkPageBreak = (height: number) => {
      if (yPos + height > 280) {
        doc.addPage();
        yPos = 20;
      }
    };

    // Header with gradient effect (simulated with colored rectangle)
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Trip destination title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(trip.destination, margin, 25);

    // Duration and status
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${duration} Days • ${trip.status || 'Planned'}`, margin, 35);

    // Dates
    if (trip.start_date && trip.end_date) {
      doc.text(
        `${format(new Date(trip.start_date), 'MMM d')} - ${format(new Date(trip.end_date), 'MMM d, yyyy')}`,
        margin,
        45
      );
    }

    yPos = 65;

    // Budget info box
    doc.setFillColor(240, 249, 255);
    doc.rect(margin, yPos, pageWidth - margin * 2, 25, 'F');
    doc.setDrawColor(37, 99, 235);
    doc.rect(margin, yPos, pageWidth - margin * 2, 25, 'S');

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Budget Overview', margin + 5, yPos + 8);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Budget: $${trip.budget?.toLocaleString() || 'N/A'}`, margin + 5, yPos + 16);
    doc.text(`Estimated Cost: $${totalCost.toLocaleString()}`, margin + 80, yPos + 16);
    
    const remaining = (trip.budget || 0) - totalCost;
    doc.text(`Remaining: $${remaining.toLocaleString()}`, margin + 140, yPos + 16);

    yPos += 35;

    // Day-by-day breakdown
    days.forEach((dayData) => {
      checkPageBreak(40);

      // Day header
      doc.setFillColor(37, 99, 235);
      doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      const dayDate = trip.start_date 
        ? format(addDays(new Date(trip.start_date), dayData.day - 1), 'EEEE, MMM d')
        : '';
      doc.text(`Day ${dayData.day}${dayDate ? ` - ${dayDate}` : ''}`, margin + 5, yPos + 7);

      yPos += 15;

      // Activities for this day
      dayData.activities.forEach((activity) => {
        checkPageBreak(25);

        // Activity card
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPos, pageWidth - margin * 2, 22, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, yPos, pageWidth - margin * 2, 22, 'S');

        // Time
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${activity.startTime} - ${activity.endTime}`, margin + 5, yPos + 6);

        // Title
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(activity.title, margin + 5, yPos + 13);

        // Location and cost
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (activity.location) {
          doc.text(`📍 ${activity.location}`, margin + 5, yPos + 19);
        }
        
        doc.setTextColor(34, 197, 94);
        doc.text(`$${activity.estimatedCost}`, pageWidth - margin - 20, yPos + 13);

        yPos += 25;
      });

      // Day total
      const dayTotal = dayData.activities.reduce((sum, a) => sum + a.estimatedCost, 0);
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Day ${dayData.day} Total: $${dayTotal}`, pageWidth - margin - 40, yPos);
      
      yPos += 15;
    });

    // Footer with branding
    checkPageBreak(30);
    yPos = 280;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos - 10, pageWidth - margin, yPos - 10);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by NxVoy - Your AI Travel Companion', margin, yPos);
    doc.text(`Created on ${format(new Date(), 'MMM d, yyyy')}`, pageWidth - margin - 45, yPos);

    // Save the PDF
    const filename = `${trip.destination.replace(/[^a-zA-Z0-9]/g, '-')}-Itinerary.pdf`;
    doc.save(filename);

    toast({
      title: 'PDF Downloaded! 📄',
      description: `Your itinerary has been saved as ${filename}`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const budgetProgress = trip.budget ? Math.min((totalCost / trip.budget) * 100, 100) : 0;
  const isOverBudget = trip.budget ? totalCost > trip.budget : false;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white print:bg-blue-600 print:text-black">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-4 text-white/80 hover:text-white hover:bg-white/10 print:hidden"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Trip Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <MapPin className="w-8 h-8 print:hidden" />
              <h1 className="text-2xl lg:text-3xl font-bold print:text-black">
                {trip.destination} • {duration} Days
              </h1>
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 capitalize print:bg-gray-200 print:text-black"
              >
                {trip.status || 'planned'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-white/90 text-sm print:text-black">
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
              <div className="mt-4 max-w-md print:hidden">
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

          {/* Action Buttons - Responsive grid on mobile */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto print:hidden">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 min-h-[44px] text-xs sm:text-sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 min-h-[44px] text-xs sm:text-sm"
              onClick={handleExportPDF}
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 min-h-[44px] text-xs sm:text-sm"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-blue-600 hover:bg-white/90 min-h-[44px] text-xs sm:text-sm"
            >
              <Check className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Saved</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryHeader;
