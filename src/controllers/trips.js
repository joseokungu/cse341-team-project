import {
  getTripById as findTripById,
  getAllTrips as findAllTrips,
} from "../models/trips.js";
import { getDb } from "../db/connect.js";

export async function getTripById(req, res) {
  try {
    const trip = await findTripById(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    return res.status(500).json({ error: "Failed to fetch trip" });
  }
}

export async function getAllTrips(req, res) {
  try {
    const trips = await findAllTrips();
    return res.status(200).json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    return res.status(500).json({ error: "Failed to fetch trips" });
  }
}

export function tripListPage(req, res) {
  return res.render("trips/list", { title: "Scenic Train Trips" });
}

export async function tripDetailsPage(req, res, next) {
  try {
    const { tripId } = req.params;
    const details = await findTripById(tripId);

    if (!details) {
      const error = new Error("Trip Not Found");
      error.status = 404;
      return next(error);
    }

    details.schedules = await getDb()
      .collection("schedules")
      .find({ tripId })
      .toArray();

    return res.render("trips/details", {
      title: "Trip Details",
      details,
    });
  } catch (error) {
    return next(error);
  }
}

