import express from 'express';
import 'dotenv/config';
import cors from 'cors';

import { routes } from './router';
import { ErrorMiddleware } from './middlewares/ErrorMiddleware';

const app = express();

app.use(express.json());
app.use(cors());
app.use(routes);
app.use(ErrorMiddleware);

app.listen(process.env.PORT);

console.log(`Api rodando na porta ${process.env.PORT}`);
