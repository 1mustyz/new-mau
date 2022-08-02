const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InterventionListSchema = Schema({
    eventId: {type: String},
    image: {type: String, default:null},
    name: {type: String, default:null},
    description: {type: String, default:null},
    
}, { timestamps: true });

const InterventionSchema = Schema({
    interventionId: {type: String, required: true, unique: [ true, 'Center ID already exist' ]},
    interventionName: {type: String,default:null},
    interventionList: [InterventionListSchema, {default:[]}],
}, { timestamps: true });

const intervention = mongoose.model('intervention', InterventionSchema)
module.exports = intervention;