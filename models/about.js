const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AboutSchema = Schema({
    aboutId: {type: String, required: true, unique: [ true, 'School ID already exist' ]},
    content: {type: Array,default:[]},
    type: {type: String,default:null},
}, { timestamps: true });

const about = mongoose.model('about', AboutSchema)
module.exports = about;