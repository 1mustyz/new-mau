const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = Schema({
    serviceId: {type: String},
    name: {type: String, default: null },
    description: [{type: Object, default: null }],
    serviceTools: [{type: Object, default: null }]

}, { timestamps: true });

module.exports = ServiceSchema;