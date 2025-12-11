import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Show } from "@/lib/types";

interface ShowCardProps {
  show: Show;
  onClick?: () => void;
}

export function ShowCard({ show, onClick }: ShowCardProps) {
  const startDate = new Date(show.startTime);
  const isUpcoming = startDate > new Date();
  const availabilityPercent = (show.availableSeats / show.totalSeats) * 100;
  
  const getAvailabilityColor = () => {
    if (availabilityPercent > 50) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (availabilityPercent > 20) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    if (availabilityPercent > 0) return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
  };

  return (
    <Card 
      className="group overflow-visible hover-elevate"
      data-testid={`card-show-${show.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold line-clamp-2" data-testid={`text-show-name-${show.id}`}>
            {show.name}
          </CardTitle>
          <Badge 
            variant={isUpcoming ? "secondary" : "outline"} 
            className="text-xs"
            data-testid={`badge-show-status-${show.id}`}
          >
            {isUpcoming ? "Upcoming" : "Past"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span data-testid={`text-show-date-${show.id}`}>
              {format(startDate, "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span data-testid={`text-show-time-${show.id}`}>
              {format(startDate, "h:mm a")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <div className="flex items-center gap-2">
              <span data-testid={`text-seats-available-${show.id}`}>
                {show.availableSeats} / {show.totalSeats} seats available
              </span>
              <Badge 
                variant="outline" 
                className={`${getAvailabilityColor()} border-0`}
                data-testid={`badge-availability-${show.id}`}
              >
                {Math.round(availabilityPercent)}%
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${availabilityPercent}%` }}
            data-testid={`progress-availability-${show.id}`}
          />
        </div>

        <Button 
          className="w-full" 
          onClick={onClick}
          disabled={show.availableSeats === 0 || !isUpcoming}
          data-testid={`button-book-${show.id}`}
        >
          {show.availableSeats === 0 ? (
            "Sold Out"
          ) : !isUpcoming ? (
            "Show Ended"
          ) : (
            <>
              Book Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
