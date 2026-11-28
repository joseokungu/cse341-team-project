
import schedule from "./schemas/schedules.js";
import { getTripById } from "./trips.js";

export async function getSchedulesByTripId(tripId, month) {
  if (month !== undefined) {
    const trip = await getTripById(tripId);

    if (!trip || !trip.operatingMonths.includes(month)) {
      return [];
    }
  }

  return schedule.find({ tripId }).lean();
}
