const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AboutSchema = Schema({
    aboutId: {type: String, required: true, unique: [ true, 'About ID' ]},
    chancellor: {type: Object,default:null},
    proChancellor: {type: Object,default:null},
    council: {type: Array, default:[]},
    principalOfficer: {type: Array, default:[]},
}, { timestamps: true });

const about = mongoose.model('about', AboutSchema)
module.exports = about;