const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DepartmentSchema = require('./department');

const SchoolSchema = Schema({
    schoolId: {type: String, required: true, unique: [ true, 'School ID already exist' ]},
    image: {type: String,default:null},
    schoolName: {type: String,default:null},
    schoolDescription: {type: String,default:null},
    shortNote: {type: String,default:null},
    dean: {type: Object,default:null},
    departmentList: [DepartmentSchema]
}, { timestamps: true });

const school = mongoose.model('school', SchoolSchema)
module.exports = school;