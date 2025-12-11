import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "CONFIRMED", "FAILED"]);
export const seatStatusEnum = pgEnum("seat_status", ["AVAILABLE", "BOOKED", "PENDING"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Shows/Trips table
export const shows = pgTable("shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startTime: timestamp("start_time").notNull(),
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Seats table
export const seats = pgTable("seats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showId: varchar("show_id").notNull().references(() => shows.id, { onDelete: "cascade" }),
  seatNumber: integer("seat_number").notNull(),
  status: seatStatusEnum("status").default("AVAILABLE").notNull(),
  lockedUntil: timestamp("locked_until"),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showId: varchar("show_id").notNull().references(() => shows.id, { onDelete: "cascade" }),
  userId: varchar("user_id"),
  seatIds: text("seat_ids").array().notNull(),
  status: bookingStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Relations
export const showsRelations = relations(shows, ({ many }) => ({
  seats: many(seats),
  bookings: many(bookings),
}));

export const seatsRelations = relations(seats, ({ one }) => ({
  show: one(shows, {
    fields: [seats.showId],
    references: [shows.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  show: one(shows, {
    fields: [bookings.showId],
    references: [shows.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
  availableSeats: true,
}).extend({
  name: z.string().min(1, "Show name is required").max(100),
  totalSeats: z.number().min(1, "Must have at least 1 seat").max(500, "Maximum 500 seats"),
  startTime: z.string().or(z.date()),
});

export const insertSeatSchema = createInsertSchema(seats).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
}).extend({
  seatIds: z.array(z.string()).min(1, "Select at least one seat"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertShow = z.infer<typeof insertShowSchema>;
export type Show = typeof shows.$inferSelect;

export type InsertSeat = z.infer<typeof insertSeatSchema>;
export type Seat = typeof seats.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// API Response types
export type ShowWithSeats = Show & { seats: Seat[] };
export type BookingWithShow = Booking & { show: Show };
