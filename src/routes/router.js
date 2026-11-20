import ejsRoutes from './ejs-routes.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { getTripsApi } from '../controllers/trips.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Pages
 *     description: Rendered site pages
 *   - name: Trains
 *     description: Train data
 *   - name: Trips
 *     description: Trip data and booking pages
 *
 * paths:
 *   /:
 *     get:
 *       tags: [Pages]
 *       summary: Get the home page
 *       responses:
 *         '200':
 *           description: Home page rendered successfully
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *         '500':
 *           description: The page could not be rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /about:
 *     get:
 *       tags: [Pages]
 *       summary: Get the about page
 *       responses:
 *         '200':
 *           description: About page rendered successfully
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *         '500':
 *           description: The page could not be rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /trains:
 *     get:
 *       tags: [Pages]
 *       summary: Get the trains page
 *       responses:
 *         '200':
 *           description: Trains page rendered successfully
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *         '500':
 *           description: The page could not be rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /api/trains:
 *     get:
 *       tags: [Trains]
 *       summary: List trains
 *       responses:
 *         '200':
 *           description: Trains returned successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   trains:
 *                     type: array
 *                     items:
 *                       type: object
 *                       additionalProperties: true
 *         '500':
 *           description: An error occurred while retrieving trains
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /api/trips:
 *     get:
 *       tags: [Trips]
 *       summary: List trips
 *       responses:
 *         '200':
 *           description: Trips returned successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   trips:
 *                     type: array
 *                     items:
 *                       type: object
 *                       additionalProperties: true
 *         '500':
 *           description: An error occurred while retrieving trips
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /trips:
 *     get:
 *       tags: [Trips]
 *       summary: Get the trips page
 *       responses:
 *         '200':
 *           description: Trips page rendered successfully
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *         '500':
 *           description: The page could not be rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /trips/{tripId}:
 *     get:
 *       tags: [Trips]
 *       summary: Get trip details
 *       parameters:
 *         - in: path
 *           name: tripId
 *           required: true
 *           description: Trip identifier
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Trip details page rendered successfully
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *         '500':
 *           description: Trip details could not be retrieved or rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /trips/booking/{scheduleId}:
 *     get:
 *       tags: [Trips]
 *       summary: Get the trip booking page
 *       parameters:
 *         - in: path
 *           name: scheduleId
 *           required: true
 *           description: Numeric schedule identifier
 *           schema:
 *             type: integer
 *       responses:
 *         '200':
 *           description: Booking page rendered successfully
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *         '500':
 *           description: Booking details could not be retrieved or rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /trips/book:
 *     post:
 *       tags: [Trips]
 *       summary: Submit a trip booking
 *       responses:
 *         '302':
 *           description: Booking accepted; redirect to the confirmation page
 *           headers:
 *             Location:
 *               description: URL of the booking confirmation page
 *               schema:
 *                 type: string
 *         '500':
 *           description: The booking could not be processed
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /trips/confirmation/{confirmationId}:
 *     get:
 *       tags: [Trips]
 *       summary: Get a booking confirmation page
 *       parameters:
 *         - in: path
 *           name: confirmationId
 *           required: true
 *           description: Booking confirmation identifier
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Confirmation page rendered successfully
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *         '500':
 *           description: Confirmation could not be retrieved or rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 *   /500:
 *     get:
 *       tags: [Pages]
 *       summary: Trigger the test server error page
 *       responses:
 *         '500':
 *           description: Test error page rendered
 *           content:
 *             text/html:
 *               schema:
 *                 type: string
 */

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Trips API
router.get('/api/trips', getTripsApi);

// Rail trips
router.use('/trips', ejsRoutes);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;