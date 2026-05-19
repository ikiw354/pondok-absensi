const express = require('express');
const path = require('path');

const app = express();

const absensiRoutes = require('./routes/absensiRoutes');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.use('/', absensiRoutes);

