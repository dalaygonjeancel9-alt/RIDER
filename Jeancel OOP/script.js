const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grab-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

// ===== BOOKING SCHEMA =====
const bookingSchema = new mongoose.Schema({
  pickupLocation: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
  driverName: String,
  driverRating: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

// ===== ROUTES =====

// CREATE - Add new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const { pickupLocation, destination, vehicleType, price } = req.body;

    if (!pickupLocation || !destination || !vehicleType || !price) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newBooking = new Booking({
      pickupLocation,
      destination,
      vehicleType,
      price
    });

    const savedBooking = await newBooking.save();
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: savedBooking
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ - Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ - Get single booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({
      success: true,
      booking: booking
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE - Update booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { pickupLocation, destination, vehicleType, price, status, driverName, driverRating } = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        pickupLocation,
        destination,
        vehicleType,
        price,
        status,
        driverName,
        driverRating,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});