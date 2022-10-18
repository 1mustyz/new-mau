const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DownloadableSchema = Schema({
    downloadId: {type: String, required: true, unique: [ true, 'download ID already exist' ]},
    downloadName: {type: String, default:null},
    downloadLink: {type: String, default:null},
    date: {type: Date, default: Date()}
}, { timestamps: true });

const downloadable = mongoose.model('downloadable', DownloadableSchema)
module.exports = downloadable;