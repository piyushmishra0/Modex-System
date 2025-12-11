import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShowSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // SHOW ROUTES
  // ============================================
  
  // Get all shows
  app.get("/api/shows", async (req, res) => {
    try {
      const shows = await storage.getAllShows();
      res.json(shows);
    } catch (error) {
      console.error("Error fetching shows:", error);
      res.status(500).json({ error: "Failed to fetch shows" });
    }
  });

  // Get show by ID with seats
  app.get("/api/shows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const show = await storage.getShowWithSeats(id);
      
      if (!show) {
        return res.status(404).json({ error: "Show not found" });
      }
      
      res.json(show);
    } catch (error) {
      console.error("Error fetching show:", error);
      res.status(500).json({ error: "Failed to fetch show" });
    }
  });

  // Create a new show (Admin)
  app.post("/api/shows", async (req, res) => {
    try {
      const validationResult = insertShowSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid show data", 
          details: validationResult.error.flatten() 
        });
      }
      
      const show = await storage.createShow(validationResult.data);
      res.status(201).json(show);
    } catch (error) {
      console.error("Error creating show:", error);
      res.status(500).json({ error: "Failed to create show" });
    }
  });

  // Delete a show (Admin)
  app.delete("/api/shows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteShow(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Show not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting show:", error);
      res.status(500).json({ error: "Failed to delete show" });
    }
  });

  // ============================================
  // BOOKING ROUTES
  // ============================================

  // Create a booking with concurrency handling
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingSchema = z.object({
        showId: z.string().min(1, "Show ID is required"),
        seatIds: z.array(z.string()).min(1, "Select at least one seat"),
        userId: z.string().optional(),
      });
      
      const validationResult = bookingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid booking data", 
          details: validationResult.error.flatten() 
        });
      }
      
      const { showId, seatIds, userId } = validationResult.data;
      
      // Check if show exists
      const show = await storage.getShowById(showId);
      if (!show) {
        return res.status(404).json({ error: "Show not found" });
      }
      
      // Check if show is in the future
      if (new Date(show.startTime) < new Date()) {
        return res.status(400).json({ error: "Cannot book for past shows" });
      }
      
      // Attempt atomic booking with row-level locking
      try {
        const booking = await storage.attemptBooking(showId, seatIds, userId);
        res.status(201).json(booking);
      } catch (bookingError: any) {
        if (bookingError.message === 'SEATS_LOCKED') {
          return res.status(409).json({ 
            error: "Some seats are currently being booked by another user. Please try again." 
          });
        }
        if (bookingError.message === 'SEATS_UNAVAILABLE') {
          return res.status(409).json({ 
            error: "One or more selected seats are no longer available." 
          });
        }
        if (bookingError.message === 'INVALID_SEATS') {
          return res.status(400).json({ 
            error: "Invalid seat selection. Some seats do not exist for this show." 
          });
        }
        throw bookingError;
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking. Please try again." });
    }
  });

  // Get booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBookingById(id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // ============================================
  // HEALTH CHECK
  // ============================================
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
