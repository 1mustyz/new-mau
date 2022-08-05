const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AlumniSchema = Schema({
    mainSlide: [{type: Object}],
    bodySlide: [{type: Object}],
    dean: {type: Object},
}, { timestamps: true });

const alumni = mongoose.model('alumni', AlumniSchema)
module.exports = alumni;