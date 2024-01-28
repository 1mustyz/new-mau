const OerSchema = require("./oer");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LibrarySchema = Schema(
  {
    librarian: {
      type: {
        name: { type: String, default: null },
        email: { type: String, default: null },
        description: { type: String, default: null },
        image: { type: String, default: null },
      },
      default: null,
    },
    oers: [
      {
        type: {
          name: { type: String, default: null },
          oerList: [{ type: OerSchema }],
        },
      },
    ],
  },
  { timestamps: true }
);

const library = mongoose.model("library", LibrarySchema);
module.exports = library;
