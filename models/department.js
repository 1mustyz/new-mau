const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StaffSchema = Schema({
    staffId: { type: String, required: true, unique: [ true, 'ID Number already exist' ] },
    qualification: {type: Array, default:[]},
    name:{type: String, default: null},
    image:{type: String, default: null},
    password:{type:String}

})

const DepartmentSchema = Schema({
    departmentId: {type: String},
    image: {type: String, default:null},
    departmentName: {type: String},
    vission: {type: String, default:null},
    mission: {type: String, default:null},
    hod: {type: Object, default:null},
    staffList: [StaffSchema],
    programs: [{type: Object,default:null}],
}, { timestamps: true });

module.exports = DepartmentSchema;

