const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CenterProgramsSchema = Schema({
    programId: {type: String},
    image: {type: String, default:null},
    name: {type: String, default:null},
    vission: {type: String, default:null},
    mission: {type: String, default:null},
    admissionRequirement: {type:Array, default: null},
    brochure: {type: String, default:null},
    type: {type: String, default: null},
    graduationRequirement: {type: Array, default: null},
    careerProspect: {type: String, default: null}

}, { timestamps: true });

module.exports = CenterProgramsSchema;