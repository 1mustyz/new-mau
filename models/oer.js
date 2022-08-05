const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OerSchema = Schema({
    oerId: {type: String, required: true, unique: [ true, 'download ID already exist' ]},
    oerName: {type: String, default:null},
    oerLink: {type: String, default:null}
}, { timestamps: true });

const oer = mongoose.model('oer', OerSchema)
module.exports = oer;