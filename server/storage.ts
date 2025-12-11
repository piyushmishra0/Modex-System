import { 
  type User, type InsertUser, 
  type Show, type InsertShow, 
  type Seat, type InsertSeat,
  type Booking, type InsertBooking,
  type ShowWithSeats,
  users, shows, seats, bookings 
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, sql, lt, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Show operations
  getAllShows(): Promise<Show[]>;
  getShowById(id: string): Promise<Show | undefined>;
  getShowWithSeats(id: string): Promise<ShowWithSeats | undefined>;
  createShow(show: InsertShow): Promise<Show>;
  deleteShow(id: string): Promise<boolean>;
  updateShowAvailableSeats(id: string, delta: number): Promise<void>;
  
  // Seat operations
  getSeatsByShowId(showId: string): Promise<Seat[]>;
  createSeats(showId: string, count: number): Promise<Seat[]>;
  lockSeats(seatIds: string[], until: Date): Promise<boolean>;
  unlockSeats(seatIds: string[]): Promise<void>;
  markSeatsAsBooked(seatIds: string[]): Promise<void>;
  releaseExpiredLocks(): Promise<number>;
  
  // Booking operations
  getBookingById(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: "PENDING" | "CONFIRMED" | "FAILED"): Promise<Booking | undefined>;
  getExpiredPendingBookings(): Promise<Booking[]>;
  
  // Concurrency-safe booking
  attemptBooking(showId: string, seatIds: string[], userId?: string): Promise<Booking>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Show operations
  async getAllShows(): Promise<Show[]> {
    return await db.select().from(shows).orderBy(shows.startTime);
  }

  async getShowById(id: string): Promise<Show | undefined> {
    const [show] = await db.select().from(shows).where(eq(shows.id, id));
    return show || undefined;
  }

  async getShowWithSeats(id: string): Promise<ShowWithSeats | undefined> {
    const show = await this.getShowById(id);
    if (!show) return undefined;
    
    const showSeats = await this.getSeatsByShowId(id);
    return { ...show, seats: showSeats };
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    const startTime = typeof insertShow.startTime === 'string' 
      ? new Date(insertShow.startTime) 
      : insertShow.startTime;
    
    const [show] = await db.insert(shows).values({
      name: insertShow.name,
      startTime,
      totalSeats: insertShow.totalSeats,
      availableSeats: insertShow.totalSeats,
    }).returning();
    
    // Create seats for the show
    await this.createSeats(show.id, insertShow.totalSeats);
    
    return show;
  }

  async deleteShow(id: string): Promise<boolean> {
    const result = await db.delete(shows).where(eq(shows.id, id)).returning();
    return result.length > 0;
  }

  async updateShowAvailableSeats(id: string, delta: number): Promise<void> {
    await db.update(shows)
      .set({ 
        availableSeats: sql`${shows.availableSeats} + ${delta}` 
      })
      .where(eq(shows.id, id));
  }

  // Seat operations
  async getSeatsByShowId(showId: string): Promise<Seat[]> {
    return await db.select().from(seats)
      .where(eq(seats.showId, showId))
      .orderBy(seats.seatNumber);
  }

  async createSeats(showId: string, count: number): Promise<Seat[]> {
    const seatValues = Array.from({ length: count }, (_, i) => ({
      showId,
      seatNumber: i + 1,
      status: "AVAILABLE" as const,
    }));
    
    return await db.insert(seats).values(seatValues).returning();
  }

  async lockSeats(seatIds: string[], until: Date): Promise<boolean> {
    // Try to lock all seats atomically using a transaction with row-level locking
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Lock the rows with FOR UPDATE to prevent concurrent modifications
      const lockQuery = `
        SELECT id FROM seats 
        WHERE id = ANY($1) 
        AND (status = 'AVAILABLE' OR (status = 'PENDING' AND locked_until < NOW()))
        FOR UPDATE NOWAIT
      `;
      
      const lockResult = await client.query(lockQuery, [seatIds]);
      
      if (lockResult.rowCount !== seatIds.length) {
        await client.query('ROLLBACK');
        return false;
      }
      
      // Update seat status to PENDING with lock expiration
      const updateQuery = `
        UPDATE seats 
        SET status = 'PENDING', locked_until = $1
        WHERE id = ANY($2)
      `;
      
      await client.query(updateQuery, [until, seatIds]);
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      return false;
    } finally {
      client.release();
    }
  }

  async unlockSeats(seatIds: string[]): Promise<void> {
    await db.update(seats)
      .set({ status: "AVAILABLE", lockedUntil: null })
      .where(
        and(
          sql`${seats.id} = ANY(${seatIds})`,
          eq(seats.status, "PENDING")
        )
      );
  }

  async markSeatsAsBooked(seatIds: string[]): Promise<void> {
    await db.update(seats)
      .set({ status: "BOOKED", lockedUntil: null })
      .where(sql`${seats.id} = ANY(${seatIds})`);
  }

  async releaseExpiredLocks(): Promise<number> {
    const result = await db.update(seats)
      .set({ status: "AVAILABLE", lockedUntil: null })
      .where(
        and(
          eq(seats.status, "PENDING"),
          lt(seats.lockedUntil, new Date())
        )
      )
      .returning();
    return result.length;
  }

  // Booking operations
  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
    
    const [booking] = await db.insert(bookings).values({
      ...insertBooking,
      expiresAt,
    }).returning();
    
    return booking;
  }

  async updateBookingStatus(id: string, status: "PENDING" | "CONFIRMED" | "FAILED"): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  async getExpiredPendingBookings(): Promise<Booking[]> {
    return await db.select().from(bookings)
      .where(
        and(
          eq(bookings.status, "PENDING"),
          lt(bookings.expiresAt, new Date())
        )
      );
  }

  // Concurrency-safe booking using PostgreSQL row-level locking
  async attemptBooking(showId: string, seatIds: string[], userId?: string): Promise<Booking> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Lock the seats with FOR UPDATE NOWAIT to fail fast on contention
      const lockQuery = `
        SELECT id, status, locked_until FROM seats 
        WHERE id = ANY($1) AND show_id = $2
        FOR UPDATE NOWAIT
      `;
      
      let lockResult;
      try {
        lockResult = await client.query(lockQuery, [seatIds, showId]);
      } catch (lockError: any) {
        await client.query('ROLLBACK');
        throw new Error('SEATS_LOCKED');
      }
      
      if (lockResult.rowCount !== seatIds.length) {
        await client.query('ROLLBACK');
        throw new Error('INVALID_SEATS');
      }
      
      // Check if all seats are available or have expired locks
      const now = new Date();
      const unavailableSeats = lockResult.rows.filter(
        (seat: any) => seat.status !== 'AVAILABLE' && 
                       !(seat.status === 'PENDING' && seat.locked_until && new Date(seat.locked_until) < now)
      );
      
      if (unavailableSeats.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('SEATS_UNAVAILABLE');
      }
      
      // Mark seats as booked
      const updateSeatsQuery = `
        UPDATE seats 
        SET status = 'BOOKED', locked_until = NULL
        WHERE id = ANY($1)
      `;
      await client.query(updateSeatsQuery, [seatIds]);
      
      // Update show available seats count
      const updateShowQuery = `
        UPDATE shows 
        SET available_seats = available_seats - $1
        WHERE id = $2
      `;
      await client.query(updateShowQuery, [seatIds.length, showId]);
      
      // Create the booking
      const createBookingQuery = `
        INSERT INTO bookings (show_id, user_id, seat_ids, status, created_at)
        VALUES ($1, $2, $3, 'CONFIRMED', NOW())
        RETURNING *
      `;
      const bookingResult = await client.query(createBookingQuery, [showId, userId || null, seatIds]);
      
      await client.query('COMMIT');
      
      const row = bookingResult.rows[0];
      return {
        id: row.id,
        showId: row.show_id,
        userId: row.user_id,
        seatIds: row.seat_ids,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const storage = new DatabaseStorage();
