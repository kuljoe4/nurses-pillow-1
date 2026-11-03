const fs = require('fs');
let c = fs.readFileSync('server/server.ts', 'utf8');

c = c.replace(
  "app.post('/api/stripe/account-link', async (req, res) => {",
  "app.post('/api/stripe/account-link', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {\n  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });"
);

c = c.replace(
  "app.get('/api/stripe/status/:hostId', async (req, res) => {",
  "app.get('/api/stripe/status/:hostId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {\n  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });"
);

c = c.replace(
  "app.post('/api/stripe/payment-intent', async (req, res) => {",
  "app.post('/api/stripe/payment-intent', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {\n  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });"
);

c = c.replace(
  "app.post('/api/stripe/payment-intent/:id/capture', async (req, res) => {",
  "app.post('/api/stripe/payment-intent/:id/capture', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {\n  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });"
);

c = c.replace(
  "app.post('/api/stripe/payment-intent/:id/cancel', async (req, res) => {",
  "app.post('/api/stripe/payment-intent/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {\n  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });"
);

fs.writeFileSync('server/server.ts', c);
