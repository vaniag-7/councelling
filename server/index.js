const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/feedback', require('./routes/feedback'));
const zoomRouter = require('./routes/zoom');
app.use('/api/zoom', zoomRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Counselling App API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
