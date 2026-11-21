# Trips API & Feature Spec (Feature Set 1)

## Purpose
Build the read-only **Trips** feature set for **Kizuna Rail** (`cse341-team-project`), backed by a Mongoose model and documented JSON API (`GET /api/trips` and `GET /api/trips/{id}`) at `/api-docs`, and hydrate/refactor the EJS trip views (`src/routes/ejs-routes.js`, `src/views/trips/list.ejs`, `src/views/trips/details.ejs`) so downstream features (such as bookings) can build on it.

- **Repository / Branch:** `cse341-team-project` | `feature/trips` (built on `foundation-mongroose-routes-swagger`)
- **Request flow:** Browser -> Routes (`src/routes/ejs-routes.js` or `src/routes/api-routes.js`) -> Controller (`src/controllers/trips.js`) -> Model (`src/models/trips.js`) -> Schema (`src/models/schemas/trips.js`) -> MongoDB `trips` collection

## Data Model
MongoDB database: Configured via `MONGODB_URI` (starter data loaded via `npm run db:import`)
MongoDB primary collection: `trips` (Mongoose model: `Trip`)
MongoDB read-only dependency collection: `schedules` (queried directly by the details controller until a schedules model is added in the Bookings feature set)

Trip object:
- `id`: string (required, unique, trimmed — URL slug such as `"alpine-panorama"`, distinct from MongoDB `_id`)
- `name`: string (required — display name)
- `description`: string (required — one or two sentences)
- `region`: string (required — lowercase; seed values: `"central"`, `"northern"`, `"kansai"`, `"hokkaido"`)
- `startStation`: string (required — lowercase station name)
- `endStation`: string (required — lowercase station name)
- `duration`: string (required — display text, e.g., `"4.5 hours"`)
- `distance`: number (required — kilometers, minimum `0`; used by booking pricing as distance x ticket class rate per km)
- `highlights`: array of string (optional — defaults to `[]`)
- `bestSeason`: string (required — seed values: `"spring"`, `"summer"`, `"autumn"`, `"winter"`)
- `operatingMonths`: array of number (optional — defaults to `[]`; values `1` to `12`)
- `imageUrl`: string (optional — path under `/images/routes/`)
- `createdAt`, `updatedAt`: Date (auto — added by Mongoose timestamps for documents written through Mongoose)
- `_id`: ObjectId (auto — 24-character hex string present on stored documents)

Schedule object (read-only dependency):
- `id`: number (used by `/trips/booking/:scheduleId`)
- `tripId`: string (references `trips.id`)
- `departureTime`, `arrivalTime`: string (`HH:MM`, e.g., `"08:30"`)
- `daysOfWeek`: array of string (lowercase day names)
- `status`: boolean (present in starter data; unused by this feature)

Starter data (`npm run db:import`):
- `alpine-panorama`: Alpine Panorama Express (`central`, `autumn`, `180` km, 2 schedules)
- `coastal-breeze`: Coastal Breeze Line (`northern`, `summer`, `147` km, 2 schedules)
- `sakura-valley`: Sakura Valley Limited (`kansai`, `spring`, `63` km, 2 schedules)
- `gorge-explorer`: Kurobe Gorge Explorer (`central`, `autumn`, `20` km, 3 schedules)
- `winter-wetlands`: Winter Wetlands Steam Train (`hokkaido`, `winter`, `31` km, 1 schedule)
- `romantic-gorge`: Sagano Romantic Train (`kansai`, `autumn`, `7` km, 4 schedules)

Data model notes:
- Starter data is imported with the native driver (`initializeDatabase`), so Mongoose schema validation, `createdAt`, `updatedAt`, and `__v` do not apply to seeded records unless written through Mongoose.
- `region` and `bestSeason` are not restricted to enums so new values can be added in data without code changes.
- Do not rely on the `id` unique index across `dropDatabase()` resets in tests because `initializeDatabase` does not create it.

## Endpoints
1. `GET /api/trips`
- Description: Return all trips as a JSON array (no wrapper object).
- Request: No query parameters or request body.
- Success status: 200
- Error status: 500
- Success response body example:
[
  {
    "_id": "6afe183a82dbe01044c7da03",
    "id": "alpine-panorama",
    "name": "Alpine Panorama Express",
    "description": "Journey through the Japanese Alps with stunning mountain views and traditional villages.",
    "region": "central",
    "startStation": "nagoya",
    "endStation": "toyama",
    "duration": "4.5 hours",
    "distance": 180,
    "highlights": [
      "Mount Tateyama views",
      "Hida River gorge",
      "Traditional alpine villages"
    ],
    "bestSeason": "autumn",
    "operatingMonths": [4, 5, 6, 7, 8, 9, 10, 11],
    "imageUrl": "/images/routes/alpine-panorama.png"
  }
]
- Empty collection response (200): `[]`
- Error response body example (500):
{
  "error": "Failed to fetch trips"
}

2. `GET /api/trips/{id}` (Express route: `/api/trips/:id`)
- Description: Return one trip by `id` (exact, case-sensitive slug match; any string is accepted, so there is no `400` response).
- Success status: 200
- Not found status: 404
- Error status: 500
- Success response body example:
{
  "_id": "6afe183a82dbe01044c7da03",
  "id": "alpine-panorama",
  "name": "Alpine Panorama Express",
  "description": "Journey through the Japanese Alps with stunning mountain views and traditional villages.",
  "region": "central",
  "startStation": "nagoya",
  "endStation": "toyama",
  "duration": "4.5 hours",
  "distance": 180,
  "highlights": [
    "Mount Tateyama views",
    "Hida River gorge",
    "Traditional alpine villages"
  ],
  "bestSeason": "autumn",
  "operatingMonths": [4, 5, 6, 7, 8, 9, 10, 11],
  "imageUrl": "/images/routes/alpine-panorama.png"
}
- Not found response body example (404):
{
  "error": "Trip not found"
}
- Error response body example (500):
{
  "error": "Failed to fetch trip"
}

3. `GET /trips` (List Page - EJS + Client Hydration)
- Description: Renders `trips/list` with title `Scenic Train Trips` without querying the database or embedding trip items in the initial HTML.
- Success status: 200 (HTML)
- Client behavior (`hookTripsList` in `public/js/main.js`):
  - Fetches `/api/trips`; on non-OK status or network error, hides `#trips-loading` and displays `"Unable to load trips right now. Please try again in a moment."` in `#trips-error`.
  - Populates `#region-filter` and `#season-filter` from distinct trip values (lowercase values, capitalized labels, `"all"` first).
  - Reads `region` and `season` from URL query params (invalid values fall back to `"all"`).
  - Clones `#trip-card-template` into `#trips-list` using `textContent` (never `innerHTML`), applying `.route-card`, `.<region>`, `.season-<bestSeason>`, `.highlight-tag` spans, `<n>km` distance, and `/trips/<id>` link.
  - Updates query string via `history.replaceState` on filter change (AND logic, no reload); shows `"No trips match those filters."` in `#trips-empty` when zero matches or empty data.

4. `GET /trips/:tripId` (Details Page - EJS)
- Description: Loads trip via `getTripById(tripId)`; passes a `404` error (`"Trip Not Found"`) to `next` if `null`, otherwise loads matching `schedules` and renders `trips/details`.
- Success status: 200 (HTML)
- Not found status: 404 (HTML)
- Error status: 500 (HTML via `next(error)`)

## Error Handling
- Do not expose database errors or stack traces to clients; log unexpected errors server-side.
- Return a simple JSON error object for 500 errors (`{ "error": "Failed to fetch trips" }` / `{ "error": "Failed to fetch trip" }`) and 404 errors (`{ "error": "Trip not found" }`).
- Document OpenAPI comments in `src/routes/api-routes.js` using `$ref: '#/components/schemas/Trip'`, run `npm run swagger`, and commit `swagger.json` (served at `/api-docs`).

## Implementation Notes
- Use a MongoDB collection named `trips` (Mongoose model `Trip`) and read-only collection `schedules`.
- Seed the collection with `npm run db:import` and use environment variables (`MONGODB_URI`) for the MongoDB connection.
- File changes:
  - Created: `src/models/schemas/trips.js`, `src/models/trips.js`, `src/controllers/trips.js`, `tests/trips.test.js`
  - Modified: `src/routes/api-routes.js`, `src/routes/ejs-routes.js`, `src/routes/router.js`, `src/views/trips/list.ejs`, `public/js/main.js`, `public/css/utilities/trips.css`, `swagger.json`, `tests/api-doc.test.js`
  - Deleted: `src/routes/trips.js`, `src/routes/list.js`, `src/routes/details.js`
- Function contracts:
  - Model (`src/models/trips.js`): `getAllTrips()` (`Trip.find({}).lean()`) and `getTripById(id)` (`Trip.findOne({ id }).lean()`)
  - API Controller (`src/controllers/trips.js`): `getAllTrips` and `getTripById`
  - EJS Controller (`src/controllers/trips.js`): `tripListPage` and `tripDetailsPage`
- Consolidated EJS routes (`src/routes/ejs-routes.js`): `GET /trips`, `GET /trips/:tripId`, `GET /trips/booking/:scheduleId`, `POST /trips/book`, `GET /trips/confirmation/:confirmationId`.
- Code conventions enforced by ESLint: ES modules only, `async/await` (no `.then` or `.catch`), always return `res.status(...).json(...)`, `consistent-return`, arrow-function callbacks, `const` over `let`.
- Verify with `npm run lint` and `npm test` (Vitest + Supertest with in-memory MongoDB via `tests/setup.js`).

## Out of Scope for Feature Set 1
- `POST`, `PUT`, `DELETE` routes for trips
- Schedules Mongoose model and booking flow (`Bookings` feature set)
- Pagination, sorting, and server-side filtering
- Authentication and authorization