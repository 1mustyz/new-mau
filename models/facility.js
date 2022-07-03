const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ServiceSchema = require('./service')

const FacilitySchema = Schema({
    facilityId: {type: String, required: true, unique: [ true, 'Center ID already exist' ]},
    image: {type: String,default:null},
    facilityName: {type: String,default:null},
    facilityDescription: {type: String,default:null},
    mission:{type: String,default:null},
    vission:{type: String,default:null},
    director: {type: Object,default:null},
    service: [ServiceSchema],

}, { timestamps: true })

const facility = mongoose.model('facility', FacilitySchema)
module.exports = facility
