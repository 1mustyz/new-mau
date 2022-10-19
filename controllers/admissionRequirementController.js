const AdmissionRequirement = require('../models/admissionRequirement')
const randomstring = require("randomstring");


// Add AddmissionRequirement
exports.addAddmissionRequirement = async (req,res,next) => {
    const {data} = req.body
    data.programId = randomstring.generate(8)
  
    try{
        await AdmissionRequirement.collection.insertOne(data)
        const result = await AdmissionRequirement.find()
        
        res.json({success: true, message: 'AdmissionRequirement created successfullty', result, newlyEvent:data});
    }catch(e){
        console.log(e)
    }
  
} 
  // edit AddmissionRequirement
exports.editAddmissionRequirement = async (req,res,next) => {
    const {programId,data} = req.body;
    try{

        await AdmissionRequirement.findOneAndUpdate({programId},data,{new:true})
        const result = await AdmissionRequirement.find()
      
        res.json({success: true,result, editedEvent:data, })
    }catch(e){
        console.log(e)
    }
  
  }

 

  // delete or remove AddmissionRequirement
exports.removeAddmissionRequirement = async (req,res,next) => {
    const {programId} = req.query;
  
    await AdmissionRequirement.findOneAndDelete({programId})
    const result = await AdmissionRequirement.find()
    res.json({success: true, message: `AdmissionRequirement with the id ${programId} has been removed`, result})
  }
  

  