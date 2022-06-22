const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CenterProgramsSchema = require('./centerPrograms');

const CenterSchema = Schema({
    centerId: {type: String, required: true, unique: [ true, 'Center ID already exist' ]},
    image: {type: String},
    centerName: {type: String},
    centerDescription: {type: String},
    mission:{type: String},
    vission:{type: String},
    shortNote: {type: String},
    dean: {type: Object},
    programs: [CenterProgramsSchema],
    staffList: [{type: Object,default:null}],

}, { timestamps: true });

const center = mongoose.model('center', CenterSchema)
module.exports = center;