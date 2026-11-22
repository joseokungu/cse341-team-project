import { describe, expect, test, vi } from "vitest";
import request from "supertest";

// Makes the schedules model fail, to check that the API answers with the safe
// message and never exposes the underlying error. This lives in its own file because
// vi.mock replaces the model for every test in the file where it is used.
vi.mock("../src/models/schedules.js", () => ({
  tripExists: async () => true,
  getSchedulesByTripId: async () => {
    throw new Error("simulated database failure");
  },
}));

const { default: app } = await import("../app.js");

describe("schedules API when the database fails", () => {
  test("GET /api/trips/:id/schedules returns a safe 500", async () => {
    const response = await request(app).get("/api/trips/alpine-panorama/schedules");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to fetch schedules" });
    expect(JSON.stringify(response.body)).not.toContain("simulated");
  });

  test("GET /api/trips/:id/schedules?month= returns a safe 500", async () => {
    const response = await request(app).get("/api/trips/alpine-panorama/schedules?month=5");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to fetch schedules" });
  });
});