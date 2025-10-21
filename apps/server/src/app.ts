import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (config.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
