require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/dbConn.js');
const credentials = require('./middleware/credentials');
const corsOptions = require('./config/corsOrigins.js');
const verifyJWT = require('./middleware/verifyJWT.js');
const PORT = process.env.PORT || 3500;

connectDB();

app.use(credentials);

app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use('/', require('./routes/authentication.js'));

app.use('/public', require('./routes/public.js'));

app.use(verifyJWT);

app.use('/holder', require('./routes/holder.js'));

app.use('/employee', require('./routes/employee.js'));

app.use('/hospital', require('./routes/hospital.js'));

app.use('/admin', require('./routes/admin.js'));

app.use((req, res) => {
    res.status(404).json({ 'message': 'PAGE-NOT-FOUND' });
});

app.use((err, req, res, next) => {
    console.error('\n\nDATE AND TIME : ' + new Date().toString());
    console.log('ERROR : ' + err.stack);
    res.status(500).json({ 'message': err.message });
});

mongoose.connection.once('open', () => {
    console.log('mongodb connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});