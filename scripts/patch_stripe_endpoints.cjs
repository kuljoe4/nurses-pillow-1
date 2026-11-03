const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server', 'server.ts');
let content = fs.readFileSync(serverFile, 'utf8');

content = content.replace(
  /app\.post\('\/api\/stripe\/account-link', async \(req, res\) => \{\n  try \{/g,
  `app.post('/api/stripe/account-link', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }`
);

content = content.replace(
  /app\.get\('\/api\/stripe\/status\/:hostId', async \(req, res\) => \{\n  try \{/g,
  `app.get('/api/stripe/status/:hostId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }`
);

content = content.replace(
  /app\.post\('\/api\/stripe\/payment-intent', async \(req, res\) => \{\n  try \{/g,
  `app.post('/api/stripe/payment-intent', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }`
);

content = content.replace(
  /app\.post\('\/api\/stripe\/payment-intent\/:id\/capture', async \(req, res\) => \{\n  try \{/g,
  `app.post('/api/stripe/payment-intent/:id/capture', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }`
);

content = content.replace(
  /app\.post\('\/api\/stripe\/payment-intent\/:id\/cancel', async \(req, res\) => \{\n  try \{/g,
  `app.post('/api/stripe/payment-intent/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }`
);

fs.writeFileSync(serverFile, content);
console.log('Patched stripe endpoints properly');
