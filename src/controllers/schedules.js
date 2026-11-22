// API controller for schedules. Same conventions as src/controllers/trains.js:
// plain JSON arrays on success, { error: "..." } on failure, and a safe 500
// message that never exposes database details.
import { getSchedulesByTripId, tripExists } from "../models/schedules.js";

const MONTH_ERROR = "month must be a whole number from 1 through 12";

// Turns the ?month= query value into a number from 1 to 12, or returns null if it is
// not one. Only plain digits are accepted, so "5" works but "abc", "5.5", "-1",
// "" and repeated values (?month=1&month=2) are all rejected.
function parseMonth(value) {
  if (typeof value !== "string" || !/^\d{1,2}$/.test(value)) {
    return null;
  }

  const month = Number(value);

  return month >= 1 && month <= 12 ? month : null;
}

// GET /api/trips/:id/schedules
export async function getSchedulesForTrip(req, res) {
  try {
    const { id } = req.params;

    if (!(await tripExists(id))) {
      return res.status(404).json({
        error: "Trip not found",
      });
    }

    const schedules = await getSchedulesByTripId(id);

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);

    return res.status(500).json({
      error: "Failed to fetch schedules",
    });
  }
}

// GET /api/trips/:id/schedules?month=5
export async function getSchedulesForTripAndMonth(req, res) {
  try {
    const { id } = req.params;
    const month = parseMonth(req.query.month);

    // Validate the input first, before touching the database.
    if (month === null) {
      return res.status(400).json({
        error: MONTH_ERROR,
      });
    }

    if (!(await tripExists(id))) {
      return res.status(404).json({
        error: "Trip not found",
      });
    }

    const schedules = await getSchedulesByTripId(id, month);

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);

    return res.status(500).json({
      error: "Failed to fetch schedules",
    });
  }
}

// One Express route serves both URLs, so this picks the right function.
// A route cannot be split on a query string, which is why this small dispatcher exists.
export function getTripSchedules(req, res) {
  if (req.query.month === undefined) {
    return getSchedulesForTrip(req, res);
  }

  return getSchedulesForTripAndMonth(req, res);
}