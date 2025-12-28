const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/members', require('./routes/members'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/incomes', require('./routes/incomes'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/common', require('./routes/common'));

app.get('/', (req, res) => {
  res.send('Insight Financial API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
