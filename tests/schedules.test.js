import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";
import { getDb } from "../src/db/connect.js";
import Schedule from "../src/models/schemas/schedules.js";
import swaggerDocument from "../swagger.json" with { type: "json" };

// These tests run against the temporary in-memory database that tests/setup.js
// resets to the starter data before every test. In that data, alpine-panorama has
// 2 schedules and operates in months 4 to 11, and gorge-explorer has 3 schedules.

const MONTH_ERROR = "month must be a whole number from 1 through 12";

describe("GET /api/trips/:id/schedules", () => {
  test("returns the schedules for a trip, earliest departure first", async () => {
    const response = await request(app).get("/api/trips/alpine-panorama/schedules");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);
    expect(response.body.every((item) => item.tripId === "alpine-panorama")).toBe(true);

    const times = response.body.map((item) => item.departureTime);
    expect(times).toEqual([...times].sort());

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          departureTime: "08:30",
          arrivalTime: "13:00",
        }),
      ])
    );
  });

  test("returns only the schedules that belong to the requested trip", async () => {
    const response = await request(app).get("/api/trips/gorge-explorer/schedules");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  test("returns an empty array for a trip with no schedules", async () => {
    await getDb().collection("trips").insertOne({
      id: "no-schedules-trip",
      operatingMonths: [1],
    });

    const response = await request(app).get("/api/trips/no-schedules-trip/schedules");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("returns 404 when the trip does not exist", async () => {
    const response = await request(app).get("/api/trips/does-not-exist/schedules");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Trip not found" });
  });
});

describe("GET /api/trips/:id/schedules?month=", () => {
  test("returns the schedules when the trip operates in that month", async () => {
    const response = await request(app).get("/api/trips/alpine-panorama/schedules?month=5");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test("returns an empty array when the trip does not operate in that month", async () => {
    const response = await request(app).get("/api/trips/alpine-panorama/schedules?month=1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test.each(["0", "13", "abc", "", "1.5", "-1", "1e1", "100"])(
    "returns 400 for the invalid month %j",
    async (month) => {
      const response = await request(app).get(
        `/api/trips/alpine-panorama/schedules?month=${month}`
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: MONTH_ERROR });
    }
  );

  test("returns 400 when the month is repeated", async () => {
    const response = await request(app).get(
      "/api/trips/alpine-panorama/schedules?month=1&month=2"
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: MONTH_ERROR });
  });

  test("returns 404 for a valid month when the trip does not exist", async () => {
    const response = await request(app).get("/api/trips/does-not-exist/schedules?month=5");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Trip not found" });
  });
});

describe("Schedule schema", () => {
  const validSchedule = {
    id: 1,
    tripId: "alpine-panorama",
    departureTime: "08:30",
    arrivalTime: "13:00",
    daysOfWeek: ["monday", "friday"],
  };

  // validate() rejects with an error that lists every field that failed.
  const failedFields = async (overrides) => {
    try {
      await new Schedule({ ...validSchedule, ...overrides }).validate();
      return [];
    } catch (error) {
      return Object.keys(error.errors);
    }
  };

  test("accepts a valid schedule", async () => {
    expect(await failedFields({})).toEqual([]);
  });

  test("rejects a missing required field", async () => {
    expect(await failedFields({ tripId: undefined })).toContain("tripId");
  });

  test("rejects a time that is not in HH:MM format", async () => {
    expect(await failedFields({ departureTime: "8:30" })).toContain("departureTime");
    expect(await failedFields({ arrivalTime: "24:00" })).toContain("arrivalTime");
  });

  test("rejects a day name outside the seven days", async () => {
    expect(await failedFields({ daysOfWeek: ["funday"] })).toContain("daysOfWeek.0");
  });

  test("rejects a schedule with no days", async () => {
    expect(await failedFields({ daysOfWeek: [] })).toContain("daysOfWeek");
  });
});

describe("Schedules API documentation", () => {
  test("documents the schedules route and its month parameter", () => {
    // If this fails after changing the route, run `npm run swagger` and commit the result.
    const operation = swaggerDocument.paths["/api/trips/{id}/schedules"].get;
    const parameterNames = operation.parameters.map((parameter) => parameter.name);

    expect(parameterNames).toEqual(expect.arrayContaining(["id", "month"]));
    expect(Object.keys(operation.responses)).toEqual(
      expect.arrayContaining(["200", "400", "404", "500"])
    );
  });
});