const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GallerySchema = Schema({
    galleryId: {type: String, default: null},
    header: {type: String, default: null},
    description: {type: String, default: null},
    eventDate: {type: String, default: null},
    image: {type: String, default: null}
}, { timestamps: true });

const gallery = mongoose.model('gallery', GallerySchema)
module.exports = gallery;