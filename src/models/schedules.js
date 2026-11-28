// Data access for schedules. Controllers call these functions and never query
// the database themselves.
import schedule from "./schemas/schedules.js";
import { getDb } from "../db/connect.js";

// Temporary: there is no Trips model on main yet, so these two helpers read the
// `trips` collection directly. When the Trips model is merged, replace them with its
// getTripById function.
export async function tripExists(tripId) {
  const count = await getDb()
    .collection("trips")
    .countDocuments({ id: tripId }, { limit: 1 });

  return count > 0;
}

async function getTripOperatingMonths(tripId) {
  const trip = await getDb()
    .collection("trips")
    .findOne({ id: tripId }, { projection: { operatingMonths: 1 } });

  return trip?.operatingMonths ?? [];
}

// Retrieve a trip's schedules, earliest departure first.
//
// Schedules have no month field of their own, so the optional `month` filter uses
// the trip's `operatingMonths`: if the trip does not operate in that month, no
// schedules apply and the result is an empty array.
export async function getSchedulesByTripId(tripId, month) {
  if (month !== undefined) {
    const operatingMonths = await getTripOperatingMonths(tripId);

    if (!operatingMonths.includes(month)) {
      return [];
    }
  }

  return schedule.find({ tripId }).sort({ departureTime: 1, id: 1 }).lean();
}