// Routes that return JSON. Every route here has an OpenAPI comment, which
// `npm run swagger` turns into swagger.json for the /api-docs page.
//
// Foundation change: this is a new file. /api/trains used to be defined in
// src/routes/router.js and queried the database directly. It now uses the trains
// controller, which returns a plain JSON array.
//
// Pattern for the other feature issues:
//   1. Add a controller function in src/controllers/.
//   2. Add the route below with its OpenAPI comment (document every status code).
//   3. Run `npm run swagger` and commit the regenerated swagger.json.
//
// Route paths here are written in full (for example '/api/trains'), so each path
// matches the one in its OpenAPI comment exactly.
import { Router } from 'express';
import { getAllTrains } from '../controllers/trains.js';
import { getAllBookings } from '../controllers/bookings.js';

const router = Router();

// The comment block below is YAML. Keep the indentation exactly as shown, because
// a wrong indent can silently drop a route from the documentation.
/**
 * @openapi
 * /api/trains:
 *   get:
 *     summary: Get all trains
 *     tags:
 *       - Trains
 *     responses:
 *       200:
 *         description: A JSON array of trains
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: series-e353
 *                   name:
 *                     type: string
 *                     example: Series E353 Limited Express
 *                   operator:
 *                     type: string
 *                   type:
 *                     type: string
 *                   maxSpeedKmh:
 *                     type: number
 *                   capacity:
 *                     type: number
 *                   powerSource:
 *                     type: string
 *                   bestFor:
 *                     type: string
 *                   description:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   imageAlt:
 *                     type: string
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/api/trains', getAllTrains);

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: A JSON array of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: JRABC12345
 *                   scheduleId:
 *                     type: number
 *                   tripId:
 *                     type: string
 *                   ticketClass:
 *                     type: string
 *                   selectedDay:
 *                     type: string
 *                   passengers:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/api/bookings', getAllBookings);

export default router;