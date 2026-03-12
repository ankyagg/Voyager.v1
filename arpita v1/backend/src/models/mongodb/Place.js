import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  rating: { type: Number, default: 0 },
  tags: [String],
  notes: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export const Place = mongoose.model('Place', placeSchema);
