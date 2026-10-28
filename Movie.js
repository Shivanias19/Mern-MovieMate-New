
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    posterUrl: {
      type: String,
      default: "",
    },
    genre: {
      type: String,
      required: true,
      enum: [
        "Action", "Comedy", "Drama", "Horror",
        "Sci-Fi", "Romance", "Thriller",
      ],
    },
    releaseYear: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear(),
    },
    runtime: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
    },
    platform: {
      type: String,
      required: true,
      enum: [
        "Netflix", "Prime Video", "Hotstar",
        "Theatre", "Other",
      ],
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    movieCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    status: {
      type: String,
      enum: ["To Watch", "Watching", "Watched"],
      default: "To Watch",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    watchedDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate titles for the same release year,
// ignoring capitalization and surrounding spaces.
movieSchema.index(
  { releaseYear: 1, title: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);

module.exports = mongoose.model("Movie", movieSchema);
