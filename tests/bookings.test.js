import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";

describe("GET /api/bookings", () => {
  test("returns a successful JSON response", async () => {
    const response = await request(app).get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(0);
  });

  test("returns all bookings from the database", async () => {
    const db = getDb();

    await db.collection("bookings").insertOne({
      id: "JRTEST123",
      scheduleId: 1,
      tripId: "TRIP001",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "123456789",
        },
      ],
    });

    const response = await request(app).get("/api/bookings");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe("JRTEST123");
    expect(response.body[0].passengers[0].firstName).toBe("John");
  });
});

describe("POST /trips/book", () => {
  test("creates a booking and redirects to its confirmation page", async () => {
    const bookingData = {
      scheduleId: 1,
      tripId: "TRIP001",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "123456789",
        },
      ],
    };

    const response = await request(app).post("/trips/book").send(bookingData);

    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/^\/trips\/confirmation\/JR/);

    const db = getDb();
    const savedBooking = await db
      .collection("bookings")
      .findOne({ tripId: "TRIP001" });

    expect(savedBooking).not.toBeNull();
    expect(savedBooking.passengers[0].firstName).toBe("John");
  });
  test("rejects a booking without passengers", async () => {
    const bookingData = {
      scheduleId: 1,
      tripId: "TRIP001",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [],
    };

    const response = await request(app).post("/trips/book").send(bookingData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid booking information");
  });
  test("displays the confirmation page for an existing booking", async () => {
    const bookingData = {
      scheduleId: 1,
      tripId: "TRIP001",
      ticketClass: "standard",
      selectedDay: "monday",
      passengers: [
        {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "123456789",
        },
      ],
    };

    const db = getDb();

    await db.collection("bookings").insertOne({
      id: "JRCONFIRM123",
      ...bookingData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).get("/trips/confirmation/JRCONFIRM123");

    expect(response.status).toBe(200);
    expect(response.text).toContain("JRCONFIRM123");
    expect(response.text).toContain("John Doe");
    expect(response.text).toContain("john@example.com");
  });
  test("returns 404 when the booking does not exist", async () => {
    const response = await request(app).get("/trips/confirmation/UNKNOWN123");

    expect(response.status).toBe(404);
    expect(response.text).toContain("Booking not found");
  });
  test("displays the booking form for an existing schedule", async () => {
    const response = await request(app).get("/trips/booking/1");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Book Trip");
    expect(response.text).toContain('value="1"');
    expect(response.text).toContain('value="alpine-panorama"');
    expect(response.text).toContain("08:30");
    expect(response.text).toContain("13:00");
    expect(response.text).toContain("Standard Class");
    expect(response.text).toContain("Premium Class");
    expect(response.text).toContain("First Class");
  });
  test("returns 404 when the schedule does not exist", async () => {
    const response = await request(app).get("/trips/booking/99999");

    expect(response.status).toBe(404);
    expect(response.text).toContain("Schedule not found");
  });
});

describe("GET /bookings-admin", () => {
  test("displays the bookings administration page", async () => {
    const response = await request(app).get("/bookings-admin");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Bookings Administration");
    expect(response.text).toContain("bookings-table");
    expect(response.text).toContain("bookings-loading");
    expect(response.text).toContain("bookings-empty");
    expect(response.text).toContain("booking-row-template");
  });
});