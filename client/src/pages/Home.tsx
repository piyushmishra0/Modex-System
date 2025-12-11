import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ShowCard } from "@/components/ShowCard";
import { PageLoader, CardSkeleton } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import type { Show } from "@/lib/types";

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: shows, isLoading, error } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const filteredShows = useMemo(() => {
    if (!shows) return [];
    if (!searchQuery.trim()) return shows;
    
    const query = searchQuery.toLowerCase();
    return shows.filter((show) =>
      show.name.toLowerCase().includes(query)
    );
  }, [shows, searchQuery]);

  const upcomingShows = useMemo(() => {
    return filteredShows
      .filter((show) => new Date(show.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [filteredShows]);

  const handleBookShow = (showId: string) => {
    setLocation(`/booking/${showId}`);
  };

  if (error) {
    return (
      <div className="container px-6 py-8">
        <EmptyState
          title="Unable to load shows"
          description="Something went wrong while fetching shows. Please try again later."
          icon="ticket"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-accent/10 py-16">
        <div className="container px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" data-testid="text-hero-title">
              Book Your Experience
            </h1>
            <p className="mt-4 text-lg text-muted-foreground" data-testid="text-hero-subtitle">
              Discover and book tickets for amazing shows, trips, and events. 
              Secure your seats with our real-time booking system.
            </p>
            
            <div className="relative mt-8 mx-auto max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search shows, trips, events..."
                className="h-12 pl-12 pr-4 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Browse upcoming events</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Real-time seat availability</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.1),transparent)]" />
      </section>

      <section className="container px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold" data-testid="text-section-title">
              {searchQuery ? "Search Results" : "Upcoming Shows"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground" data-testid="text-show-count">
              {isLoading ? "Loading..." : `${upcomingShows.length} show${upcomingShows.length !== 1 ? "s" : ""} available`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : upcomingShows.length === 0 ? (
          <EmptyState
            title={searchQuery ? "No shows found" : "No upcoming shows"}
            description={
              searchQuery
                ? `No shows match "${searchQuery}". Try a different search term.`
                : "There are no upcoming shows at the moment. Check back later or create one from the admin panel."
            }
            actionLabel={searchQuery ? undefined : "Go to Admin"}
            actionHref={searchQuery ? undefined : "/admin"}
            icon="ticket"
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="grid-shows">
            {upcomingShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onClick={() => handleBookShow(show.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
