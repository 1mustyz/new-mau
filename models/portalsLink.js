const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PortalLinksSchema = Schema({
    portalId: {type: String, required: true, unique: [ true, 'download ID already exist' ]},
    portalName: {type: String, default:null},
    portalLinkValue: {type: String, default:null}
}, { timestamps: true });

const portalLinks = mongoose.model('portalLinks', PortalLinksSchema)
module.exports = portalLinks;