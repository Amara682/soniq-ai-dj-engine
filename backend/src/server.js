import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and set a secret.');
  process.exit(1);
}
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`SONIQ API running at http://localhost:${port}`));
