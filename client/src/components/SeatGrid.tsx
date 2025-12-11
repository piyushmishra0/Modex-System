import { cn } from "@/lib/utils";
import type { Seat } from "@/lib/types";

interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatToggle: (seatId: string) => void;
  disabled?: boolean;
}

export function SeatGrid({ seats, selectedSeats, onSeatToggle, disabled = false }: SeatGridProps) {
  const sortedSeats = [...seats].sort((a, b) => a.seatNumber - b.seatNumber);
  const columns = Math.min(10, Math.ceil(Math.sqrt(seats.length)));

  const getSeatStatus = (seat: Seat) => {
    if (selectedSeats.includes(seat.id)) return "selected";
    if (seat.status === "BOOKED" || seat.status === "PENDING") return "booked";
    return "available";
  };

  const getSeatClasses = (status: string) => {
    switch (status) {
      case "selected":
        return "bg-primary text-primary-foreground border-primary scale-105 shadow-md";
      case "booked":
        return "bg-muted text-muted-foreground border-muted cursor-not-allowed opacity-50";
      default:
        return "bg-card border-border hover:border-primary hover:bg-primary/5 cursor-pointer";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-6 rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md border-2 bg-card border-border" />
          <span className="text-sm text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary border-2 border-primary" />
          <span className="text-sm text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-muted border-2 border-muted opacity-50" />
          <span className="text-sm text-muted-foreground">Booked</span>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="rounded-t-full bg-gradient-to-b from-muted to-transparent px-16 py-3 text-center text-sm font-medium text-muted-foreground">
          SCREEN / STAGE
        </div>
      </div>

      <div 
        className="grid justify-center gap-2 p-4"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          maxWidth: `${columns * 52}px`,
          margin: "0 auto"
        }}
        data-testid="seat-grid"
      >
        {sortedSeats.map((seat) => {
          const status = getSeatStatus(seat);
          const isInteractive = status === "available" || status === "selected";

          return (
            <button
              key={seat.id}
              onClick={() => {
                if (isInteractive && !disabled) {
                  onSeatToggle(seat.id);
                }
              }}
              disabled={!isInteractive || disabled}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md border-2 text-xs font-medium transition-all duration-200",
                getSeatClasses(status),
                disabled && isInteractive && "opacity-50 cursor-not-allowed"
              )}
              data-testid={`seat-${seat.seatNumber}`}
              data-seat-id={seat.id}
              data-status={status}
            >
              {seat.seatNumber}
            </button>
          );
        })}
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-4 rounded-lg bg-primary/5 p-4 text-center">
          <span className="text-sm text-muted-foreground">Selected seats: </span>
          <span className="font-semibold" data-testid="text-selected-seats">
            {selectedSeats
              .map(id => sortedSeats.find(s => s.id === id)?.seatNumber)
              .filter(Boolean)
              .sort((a, b) => (a as number) - (b as number))
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
