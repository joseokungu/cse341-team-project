
import { getTripById } from "../models/trips.js";
import { getSchedulesByTripId } from "../models/schedules.js";

export async function getSchedulesForTrip(req, res) {
  try {
    const { id } = req.params;

    const trip = await getTripById(id);

    if (!trip) {
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

export async function getSchedulesForTripAndMonth(req, res) {
  const { month } = req.query;

  if (!/^(?:[1-9]|1[0-2])$/.test(month ?? "")) {
    return res.status(400).json({
      error: "month must be a whole number from 1 through 12",
    });
  }

  try {
    const { id } = req.params;

    const trip = await getTripById(id);

    if (!trip) {
      return res.status(404).json({
        error: "Trip not found",
      });
    }

    const schedules = await getSchedulesByTripId(id, Number(month));

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);

    return res.status(500).json({
      error: "Failed to fetch schedules",
    });
  }
}
