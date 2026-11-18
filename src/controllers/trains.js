// This file is the team's complete example of an API controller. Each function
// calls a model function and returns JSON:
//   - lists are returned as a plain JSON array (no { trains: [...] } wrapper)
//   - a missing item returns 404 with { error: "..." }
//   - unexpected failures log the real error on the server and return a safe
//     500 message, never the database error itself
import {
  getTrainById as findTrainById,
  getAllTrains as findAllTrains,
} from "../models/trains.js";

export async function getTrainById(req, res) {
  try {
    const { id } = req.params;

    const train = await findTrainById(id);

    if (!train) {
      return res.status(404).json({
        error: "Train not found",
      });
    }

    return res.status(200).json(train);
  } catch (error) {
    console.error("Error fetching train:", error);

    return res.status(500).json({
      error: "Failed to fetch train",
    });
  }
}

// Foundation change: GET /api/trains now uses this function (through
// src/routes/api-routes.js) instead of querying the database inside the route file.
export async function getAllTrains(req, res) {
  try {
    const trains = await findAllTrains();

    return res.status(200).json(trains);
  } catch (error) {
    console.error("Error fetching trains:", error);

    return res.status(500).json({
      error: "Failed to fetch trains",
    });
  }
}

// Foundation change: the trains page handler moved here from src/routes/trains.js,
// which was deleted. It is an EJS controller function: it renders a page instead of
// returning JSON. The trains page then fills itself in from /api/trains in the
// browser (see hookTrainsCatalog in public/js/main.js).
export function trainsPage(req, res) {
  return res.render("trains", { title: "Trains" });
}