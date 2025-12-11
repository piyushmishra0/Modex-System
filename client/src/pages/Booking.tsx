import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeatGrid } from "@/components/SeatGrid";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Users, ArrowLeft, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import type { ShowWithSeats, Booking } from "@/lib/types";

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const { toast } = useToast();

  const { data: show, isLoading, error, refetch } = useQuery<ShowWithSeats>({
    queryKey: ["/api/shows", id],
  });

  const bookingMutation = useMutation({
    mutationFn: async (seatIds: string[]) => {
      const response = await apiRequest("POST", "/api/bookings", {
        showId: id,
        seatIds,
      });
      return response.json();
    },
    onSuccess: (booking: Booking) => {
      setCurrentBooking(booking);
      setSelectedSeats([]);
      queryClient.invalidateQueries({ queryKey: ["/api/shows", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      
      if (booking.status === "CONFIRMED") {
        toast({
          title: "Booking confirmed!",
          description: `Successfully booked ${booking.seatIds.length} seat(s).`,
        });
      } else if (booking.status === "PENDING") {
        toast({
          title: "Booking pending",
          description: "Your booking is being processed...",
        });
        pollBookingStatus(booking.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Unable to complete booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const pollBookingStatus = async (bookingId: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setCurrentBooking(prev => prev ? { ...prev, status: "FAILED" } : null);
        return;
      }
      
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (response.ok) {
          const booking: Booking = await response.json();
          setCurrentBooking(booking);
          
          if (booking.status === "PENDING") {
            attempts++;
            setTimeout(poll, 2000);
          } else {
            queryClient.invalidateQueries({ queryKey: ["/api/shows", id] });
          }
        }
      } catch {
        attempts++;
        setTimeout(poll, 2000);
      }
    };
    
    setTimeout(poll, 2000);
  };

  const handleSeatToggle = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "No seats selected",
        description: "Please select at least one seat to continue.",
        variant: "destructive",
      });
      return;
    }
    bookingMutation.mutate(selectedSeats);
  };

  const handleNewBooking = () => {
    setCurrentBooking(null);
    setSelectedSeats([]);
    refetch();
  };

  if (isLoading) {
    return <PageLoader text="Loading show details..." />;
  }

  if (error || !show) {
    return (
      <div className="container px-6 py-8">
        <EmptyState
          title="Show not found"
          description="The show you're looking for doesn't exist or has been removed."
          actionLabel="Browse Shows"
          actionHref="/"
          icon="ticket"
        />
      </div>
    );
  }

  const startDate = new Date(show.startTime);
  const isUpcoming = startDate > new Date();

  if (currentBooking) {
    return (
      <div className="container max-w-lg px-6 py-12">
        <Card className="text-center">
          <CardContent className="pt-8 space-y-6">
            {currentBooking.status === "CONFIRMED" ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-booking-success">
                    Booking Confirmed!
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Your seats have been successfully reserved.
                  </p>
                </div>
              </>
            ) : currentBooking.status === "PENDING" ? (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                  <RefreshCw className="h-8 w-8 text-yellow-500 animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Processing...</h2>
                  <p className="mt-2 text-muted-foreground">
                    Your booking is being confirmed. Please wait.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-booking-failed">
                    Booking Failed
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Sorry, we couldn't complete your booking. The seats may have been taken.
                  </p>
                </div>
              </>
            )}

            <div className="rounded-lg bg-muted/50 p-4 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Show</span>
                <span className="font-medium" data-testid="text-booking-show">{show.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="font-medium">{format(startDate, "h:mm a")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Seats</span>
                <span className="font-medium" data-testid="text-booking-seats">
                  {currentBooking.seatIds.length} seat(s)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <BookingStatusBadge status={currentBooking.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Booking ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded" data-testid="text-booking-id">
                  {currentBooking.id.slice(0, 8)}
                </code>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {currentBooking.status !== "PENDING" && (
                <Button onClick={handleNewBooking} data-testid="button-book-more">
                  Book More Seats
                </Button>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full" data-testid="button-back-home">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Shows
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl px-6 py-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shows
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl" data-testid="text-show-name">
                  {show.name}
                </CardTitle>
                <CardDescription>
                  Select your seats and confirm booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-booking-date">
                    {format(startDate, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-booking-time">
                    {format(startDate, "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-available-seats">
                    {show.availableSeats} / {show.totalSeats} seats available
                  </span>
                </div>
                <Badge variant={isUpcoming ? "secondary" : "outline"}>
                  {isUpcoming ? "Upcoming" : "Past Event"}
                </Badge>
              </CardContent>
            </Card>

            {selectedSeats.length > 0 && (
              <Card className="border-primary">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Selected Seats</span>
                    <Badge variant="secondary" data-testid="badge-seat-count">
                      {selectedSeats.length}
                    </Badge>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConfirmBooking}
                    disabled={bookingMutation.isPending || !isUpcoming}
                    data-testid="button-confirm-booking"
                  >
                    {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Your Seats</CardTitle>
              <CardDescription>
                Click on available seats to select them for booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {show.seats && show.seats.length > 0 ? (
                <SeatGrid
                  seats={show.seats}
                  selectedSeats={selectedSeats}
                  onSeatToggle={handleSeatToggle}
                  disabled={bookingMutation.isPending || !isUpcoming}
                />
              ) : (
                <EmptyState
                  title="No seats available"
                  description="Seats for this show haven't been configured yet."
                  icon="ticket"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
