import type { Show, Seat, Booking, BookingWithShow, ShowWithSeats } from "@shared/schema";

export type { Show, Seat, Booking, BookingWithShow, ShowWithSeats };

export type BookingStatus = "PENDING" | "CONFIRMED" | "FAILED";
export type SeatStatus = "AVAILABLE" | "BOOKED" | "PENDING";

export interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatToggle: (seatId: string) => void;
  disabled?: boolean;
}

export interface ShowCardProps {
  show: Show;
  onClick?: () => void;
}

export interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}
