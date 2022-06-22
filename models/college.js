const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DepartmentSchema = require('./department');

const CollegeSchema = Schema({
    collegeId: {type: String, required: true, unique: [ true, 'College ID already exist' ]},
    image: {type: String},
    collegeName: {type: String},
    collegeDescription: {type: String},
    shortNote: {type: String},
    mission: {type: String},
    vission: {type: String},
    dean: {type: Object},
    departmentList: [DepartmentSchema]
}, { timestamps: true });

const college = mongoose.model('college', CollegeSchema)
module.exports = college;