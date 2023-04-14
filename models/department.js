const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ProgramSchema = require('./centerPrograms')

const StaffSchema = Schema({
    staffId: { type: String, required: true, unique: [ true, 'ID Number already exist' ] },
    rank: {type: String, default: null},
    major: {type: String, default: null},
    email: {type: String, default: null},
    name:{type: String, default: null},
    image:{type: String, default: null},
    password:{type:String}

})

const DepartmentSchema = Schema({
    departmentId: {type: String},
    image: {type: String, default:null},
    departmentName: {type: String,default:null},
    vission: {type: String, default:null},
    mission: {type: String, default:null},
    introduction: {type: String, default:null},
    hod: {type: Object, default:null},
    staffList: [StaffSchema],
    programs: [ProgramSchema],
    facilities: {type: Array, default:[]},
    services: {type: Array, default:[]},
    laboratories: {type: Array, default:[]},
    equipments: {type: Array, default:[]},


}, { timestamps: true });

module.exports = DepartmentSchema;

