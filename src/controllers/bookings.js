import {
  getAllBookings as findAllBookings,
  createBooking,
  getBookingById as findBookingById,
} from "../models/bookings.js";

import { getDb } from "../db/connect.js";
import { generateConfirmationCode } from "../includes/helpers.js";

// Retrieve all bookings and return them as JSON.
export async function getAllBookings(req, res) {
  try {
    const bookings = await findAllBookings();

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);

    return res.status(500).json({
      error: "Failed to fetch bookings",
    });
  }
}

// Display the bookings administration page.
export function bookingsAdminPage(req, res) {
  return res.render("bookings", {
    title: "Bookings Administration",
  });
}

// Display the booking form for a selected schedule.
export async function bookingPage(req, res) {
  const { scheduleId } = req.params;

  const db = getDb();

  const schedule = await db
    .collection("schedules")
    .findOne({ id: Number(scheduleId) });

  if (!schedule) {
    return res.status(404).send("Schedule not found");
  }

  const trip = await db.collection("trips").findOne({ id: schedule.tripId });

  if (!trip) {
    return res.status(404).send("Trip not found");
  }

  const ticketClasses = await db.collection("ticketClasses").find({}).toArray();

  const ticketOptions = ticketClasses.map((ticketClass) => ({
    class: ticketClass.class,
    name: ticketClass.name,
    price: trip.distance * ticketClass.pricePerKm,
    amenities: ticketClass.amenities,
    description: ticketClass.description,
  }));

  return res.render("trips/book", {
    title: "Book Trip",
    schedule,
    ticketOptions,
  });
}

// Process the submitted booking form and save the booking.
export async function processBookingRequest(req, res, next) {
  try {
    const bookingData = {
      ...req.body,
      id: generateConfirmationCode(),
    };

    const booking = await createBooking(bookingData);

    return res.redirect(`/trips/confirmation/${booking.id}`);
  } catch (error) {
    // Invalid booking data should return a client error.
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid booking information",
      });
    }

    // Pass unexpected errors to the application error handler.
    return next(error);
  }
}

// Display the confirmation page for a specific booking.
export async function bookingConfirmationPage(req, res) {
  const { confirmationId } = req.params;

  const confirmation = await findBookingById(confirmationId);

  if (!confirmation) {
    return res.status(404).send("Booking not found");
  }

  return res.render("trips/confirm", {
    title: "Trip Confirmation",
    confirmation,
  });
}
