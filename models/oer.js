const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OerSchema = Schema(
  {
    oerName: { type: String, default: null },
    oerLink: { type: String, default: null },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = OerSchema;
