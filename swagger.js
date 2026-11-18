// Generates swagger.json from the OpenAPI comments in the route files.
// Run it with `npm run swagger` after adding or changing any API route, and commit
// the regenerated swagger.json. app.js serves it at /api-docs, and Render serves the
// committed file, so it is not generated during deployment.
//
// Foundation change: this is a new file.
import { writeFileSync } from 'node:fs';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail API',
      version: '1.0.0',
      description: 'JSON API for the Kizuna Rail scenic train trips application'
    },
    servers: [
      {
        // A relative URL, so Try it out works locally and on Render.
        url: '/',
        description: 'Current server'
      }
    ],
    components: {
      schemas: {
        // Shared error shape. Routes reference it with
        // $ref: '#/components/schemas/Error'. It matches the controllers, which
        // return { error: "message" }.
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Failed to fetch trains'
            }
          }
        }
      }
    }
  },
  // Only this file is scanned for OpenAPI comments. Add other route files here if
  // API routes are ever placed in them.
  apis: ['./src/routes/api-routes.js']
};

const swaggerSpec = swaggerJsdoc(options);

writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));
console.log('Swagger documentation generated.');