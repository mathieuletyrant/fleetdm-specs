import express, { Request, Response, NextFunction } from 'express';
import { activitiesRouter } from './routes/activities';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Fleet API is running' });
});

app.use('/api/v1/fleet', activitiesRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✓ Fleet API server is running on http://localhost:${PORT}`);
    console.log(`✓ OpenAPI spec: ./openapi.json`);
    console.log(`✓ Health: http://localhost:${PORT}/health`);
    console.log(`✓ Activities: http://localhost:${PORT}/api/v1/fleet/activities`);
  });
}

export default app;
