import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Clock, Wallet, Trash2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Trip {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: string | null;
  created_at: string;
}

interface TripCardProps {
  trip: Trip;
  onDelete: (tripId: string) => void;
  isDeleting: boolean;
}

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'planned':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'draft':
    case 'planning':
    default:
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  }
};

const formatStatus = (status: string | null) => {
  if (!status) return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const TripCard = ({ trip, onDelete, isDeleting }: TripCardProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageError, setImageError] = useState(false);

  const duration = trip.start_date && trip.end_date
    ? differenceInDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1
    : null;

  const dateRange = trip.start_date && trip.end_date
    ? `${format(parseISO(trip.start_date), 'MMM d')} - ${format(parseISO(trip.end_date), 'd, yyyy')}`
    : 'Dates not set';

  const formattedBudget = trip.budget
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(trip.budget)
    : 'Budget not set';

  const imageUrl = !imageError
    ? `https://source.unsplash.com/800x600/?${encodeURIComponent(trip.destination)},travel,landscape`
    : '/placeholder.svg';

  const handleCardClick = () => {
    navigate(`/itinerary/${trip.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete(trip.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="group"
      >
        <Card 
          className="overflow-hidden cursor-pointer glass-card border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
          onClick={handleCardClick}
        >
          {/* Image Section */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={trip.destination}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Status Badge */}
            <Badge 
              className={`absolute top-3 left-3 ${getStatusColor(trip.status)} border`}
            >
              {formatStatus(trip.status)}
            </Badge>

            {/* Delete Button - Always visible on mobile */}
            <button
              onClick={handleDeleteClick}
              className="absolute top-3 right-3 p-2.5 rounded-full bg-black/50 backdrop-blur-sm opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/80 hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
              disabled={isDeleting}
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>

            {/* Destination Name */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <MapPin className="w-3 h-3" />
                <span>Destination</span>
              </div>
              <h3 className="text-xl font-bold text-white font-heading truncate">
                {trip.destination}
              </h3>
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="p-4 space-y-4">
            {/* Date and Duration */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono">{dateRange}</span>
              </div>
              {duration && (
                <Badge variant="secondary" className="bg-white/5 text-white/80">
                  <Clock className="w-3 h-3 mr-1" />
                  {duration} {duration === 1 ? 'Day' : 'Days'}
                </Badge>
              )}
            </div>

            {/* Budget */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-mono text-white/90">{formattedBudget}</span>
            </div>

            {/* View Itinerary Button - Touch-friendly */}
            <Button 
              className="w-full btn-primary-gradient border-0 group/btn min-h-[48px] text-base"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/itinerary/${trip.id}`);
              }}
            >
              View Itinerary
              <motion.span
                className="ml-2"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
              >
                →
              </motion.span>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Trip</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete your trip to <span className="text-white font-semibold">{trip.destination}</span>? 
              This action cannot be undone and will also delete all associated itinerary items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Trip'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TripCard;
