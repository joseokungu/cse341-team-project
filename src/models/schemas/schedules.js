// Mongoose schema for the `schedules` collection. Follows the same pattern as
// src/models/schemas/trains.js and bookings.js. The fields mirror
// src/db/seeds/schedules.json.
import mongoose from "mongoose";

// 24-hour HH:MM, for example "08:30".
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const scheduleSchema = new mongoose.Schema(
  {
    // Schedule ids are numbers (the booking page uses /trips/booking/:scheduleId).
    id: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },
    // The `id` slug of the trip this schedule belongs to, for example "alpine-panorama".
    tripId: {
      type: String,
      required: true,
      trim: true,
    },
    departureTime: {
      type: String,
      required: true,
      trim: true,
      match: TIME_PATTERN,
    },
    arrivalTime: {
      type: String,
      required: true,
      trim: true,
      match: TIME_PATTERN,
    },
    // Every value must be one of the seven lowercase day names, and there must be at least one.
    daysOfWeek: {
      type: [{ type: String, enum: DAYS_OF_WEEK }],
      validate: {
        validator: (days) => days.length >= 1,
        message: "A schedule must run on at least one day.",
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    // The collection already exists with this name. Setting it explicitly makes sure
    // Mongoose never points at a differently named (empty) collection.
    collection: "schedules",
  }
);

const schedule = mongoose.model("Schedule", scheduleSchema);

export default schedule;
