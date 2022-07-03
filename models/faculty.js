const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DepartmentSchema = require('./department');

const FacultySchema = Schema({
    facultyId: {type: String, required: true, unique: [ true, 'Faculty ID already exist' ]},
    image: {type: String,default:null},
    facultyName: {type: String,default:null},
    facultyDescription: {type: String,default:null},
    shortNote: {type: String,default:null},
    dean: {type: Object,default:null},
    departmentList: [DepartmentSchema]
}, { timestamps: true });

const faculty = mongoose.model('faculty', FacultySchema)
module.exports = faculty;