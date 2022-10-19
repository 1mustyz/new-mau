const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdmissionRequirementSchema = Schema({
    programId: {type: String, required: true, unique: [ true, 'download ID already exist' ]},
    programType: {type: String, default:null},
    link: {type: String, default:null},
    requirement: {type: Array, default:[]}
}, { timestamps: true });

const AdmissionRequirement = mongoose.model('admissionRequirement', AdmissionRequirementSchema)
module.exports = AdmissionRequirement;