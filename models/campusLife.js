const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CampusLifeSchema = Schema({
    mainSlide: [{type: Object}],
    bodySlide: [{type: Object}],
    dean: {type: Object},
}, { timestamps: true });

const campusLife = mongoose.model('campusLife', CampusLifeSchema)
module.exports = campusLife;