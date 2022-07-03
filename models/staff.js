const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const StaffSchema = new Schema({
    username: { type: String, required: true, unique: [ true, 'ID Number already exist' ] },
    firstName: { type: String, required: true},
    lastName: { type: String, required: true},
    gender: { type: String,default:null},
    phone: { type: String, required: true},
    address: { type: String,default:null},
    image: { type: String, default: null },
}, { timestamps: true });

//plugin passport-local-mongoose to enable password hashing and salting and other things
StaffSchema.plugin(passportLocalMongoose);

//connect the schema with user table
const Staff = mongoose.model('staff', StaffSchema);

//export the model 
module.exports = Staff;