const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DepartmentSchema = require('./department');

const SchoolSchema = Schema({
    schoolId: {type: String, required: true, unique: [ true, 'School ID already exist' ]},
    image: {type: String},
    schoolName: {type: String},
    schoolDescription: {type: String},
    shortNote: {type: String},
    dean: {type: Object},
    departmentList: [DepartmentSchema]
}, { timestamps: true });

const school = mongoose.model('school', SchoolSchema)
module.exports = school;