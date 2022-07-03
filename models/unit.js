const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CenterProgramsSchema = require('./centerPrograms');

const UnitSchema = Schema({
    unitId: {type: String, required: true, unique: [ true, 'Center ID already exist' ]},
    image: {type: String,default:null},
    unitName: {type: String,default:null},
    unitDescription: {type: String,default:null},
    mission:{type: String,default:null},
    vission:{type: String,default:null},
    shortNote: {type: String,default:null},
    dean: {type: Object,default:null},
    programs: [CenterProgramsSchema],
    staffList: [{type: Object,default:null}],

}, { timestamps: true });

const unit = mongoose.model('unit', UnitSchema)
module.exports = unit;