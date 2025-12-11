import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ShowWithSeats, Booking } from "@/lib/types";

interface AppContextType {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  selectedShow: ShowWithSeats | null;
  setSelectedShow: (show: ShowWithSeats | null) => void;
  selectedSeats: string[];
  setSelectedSeats: (seats: string[]) => void;
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  refreshShows: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ShowWithSeats | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  
  const queryClient = useQueryClient();

  const refreshShows = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
  }, [queryClient]);

  return (
    <AppContext.Provider
      value={{
        isAdmin,
        setIsAdmin,
        selectedShow,
        setSelectedShow,
        selectedSeats,
        setSelectedSeats,
        currentBooking,
        setCurrentBooking,
        refreshShows,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
