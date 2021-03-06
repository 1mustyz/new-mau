const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CenterProgramsSchema = require('./centerPrograms');

const CenterSchema = Schema({
    centerId: {type: String, required: true, unique: [ true, 'Center ID already exist' ]},
    image: {type: String,default:null},
    centerName: {type: String,default:null},
    centerDescription: {type: String,default:null},
    mission:{type: String,default:null},
    vission:{type: String,default:null},
    shortNote: {type: String,default:null},
    dean: {type: Object,default:null},
    programs: [CenterProgramsSchema],
    staffList: [{type: Object,default:null}],

}, { timestamps: true });

const center = mongoose.model('center', CenterSchema)
module.exports = center;