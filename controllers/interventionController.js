const Intervention = require('../models/intervention')
const randomstring = require("randomstring");
const { singleUpload, singleFileUpload, singleAllMediaUpload } = require('../middlewares/filesMiddleware')
const fs = require('fs')
const multer = require('multer')
const cloudinary = require('cloudinary');
const {interventionListDelete} = require('./interventionListDelete')

// add interventions
exports.addIntervention = async (req,res,next) => {
    req.body.interventionId = randomstring.generate(8)
       
    try {
        await Intervention.collection.insertOne(req.body)
  
        const result = await Intervention.find({})
        
  
        res.json({success: true, result});
  
      
    } catch (error) {
    console.log(error);
      
    }
  }

  // add intervention list
exports.addInterventionList = async (req,res,next) => {
    const {intervention} = req.body
    const {interventionId} = req.query
    intervention.eventId = randomstring.generate(8)

    try {
        
        await Intervention.findOneAndUpdate({interventionId},{$push:{"interventionList":intervention}},{new:true})
        const result = await Intervention.findOne({interventionId})
        res.json({success: true, message: 'Intervention event created successfullty', result});
    } catch (error) {
        console.log(error)
    }
  
  }
  
  // edit Intervention
  exports.editIntervention = async (req,res,next) => {
    const {interventionId} = req.query;
    try {
      await Intervention.findOneAndUpdate({interventionId:interventionId}, req.body,{new:true})
    const result = await Intervention.find()
  
      res.json({success: true, message: `Intervention with the ID ${interventionId} has been edited`,result})
      
    } catch (error) {
      console.log(error)
    }
   
  }

  // edit interventionList
  exports.editInterventionList = async (req,res,next) => {
    const {eventId} = req.query;
    
    try {
      await Intervention.findOneAndUpdate({"interventionList.eventId": eventId},{$set:{
        "interventionList.$[e1].name":req.body.name,
        "interventionList.$[e1].description":req.body.description,

      }},
      { 
        arrayFilters: [
          {"e1.eventId": eventId},
        ],
      })

      result = await Intervention.findOne({"interventionList.eventId": eventId})
  
      res.json({success: true, result})
      
    } catch (error) {
      console.log(error)
    }
   
  }

   // delete intervention list
exports.removeInterventionList = async (req,res,next) => {
    const {eventId,interventionId} = req.query;
    try {
       await interventionListDelete(Intervention,eventId,interventionId,req,res)
      
    } catch (error) {
    console.log({success: false, error})
      
    }
  }

  // delete or remove intervention
exports.removeIntervention = async (req,res,next) => {
    const {interventionId} = req.query   

    const bigPromise = async () => {
      const resultImage = await Intervention.findOne({interventionId:interventionId})
      console.log(resultImage)
  
      // remove service tools image
    
        if(resultImage.interventionList.length !=0 ){
          resultImage.interventionList.map((list)=>{
            console.log(list)
      
            if (list.image != null && list.image != undefined){
                  console.log(list.image)
                    const ImageName = list.image.split('/').splice(7)
                        console.log('-----------------',ImageName)
                
                        cloudinary.v2.api.delete_resources_by_prefix(ImageName[0], 
                        {
                          invalidate: true,
                          resource_type: "raw"
                      }, 
                        function(error,result) {
                          console.log(result, error) 
                        }); 
               
            }
            
          })
    
        }
  
    }
    const myPromise = new Promise(async (resolve, reject) => {
      resolve(bigPromise())
    });
    myPromise.then(async ()=>{
           
      let result
      
      await Intervention.findOneAndDelete({"Intervention":Intervention})
      result = await Intervention.find()
      res.json({success: true, message: `Intervention with the ID ${Intervention} has been removed`, result})
  })
  
  }

  exports.addInterventionListImage = async (req,res, next) => {
    const {eventId} = req.query
    console.log(eventId)
    try {
      fs.rmSync('./public/images', { recursive: true });
    } catch(err) {
      console.error(err)
    }
  
  
    const dir = './public/images';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
          recursive: true
        });
      }
  
    singleUpload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
      return res.json(err.message);
      }
      else if (err) {
        return res.json(err);
      }
      else if (!req.file) {
        return res.json({"image": req.file, "msg":'Please select an image to upload'});
      }
      if(req.file){
        // console.log('1111111',req.file)
  
        try {
  
            const result = await Intervention.aggregate([
              {$match: {"interventionList.eventId": eventId}},
              {$project: {interventionList:1}},
              {$unwind: "$interventionList"},
              {$match: {"interventionList.eventId": eventId}}
              
            ])
    
            console.log('--',result[0].interventionList.image)
            
            if(result[0].interventionList.image != null){
            // console.log('222222','hshsisi')
    
              
              const imageName = result[0].interventionList.image.split('/').splice(7)
              console.log('-----------------',imageName)
    
               cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
              {
                invalidate: true,
                  resource_type: "raw"
              }, 
                function(error,result) {
                  // console.log('33333333',result, error)
                });  
            }
    
            cloudinary.v2.uploader.upload(req.file.path, 
            { resource_type: "raw" }, 
            async function(error, result) {
              console.log('444444',result, error); 
    
              await Intervention.findOneAndUpdate({"interventionList.eventId": eventId},{$set:{
                "interventionList.$[e1].image":result.secure_url,
              }},
              { 
                arrayFilters: [
                  {"e1.eventId": eventId},
                  ],
              })

              let allResult = await Intervention.findOne({"interventionList.eventId": eventId})
              
              res.json({success: true,
                message: allResult,
                          },
              
              );
            });
         
           
          
          
        }catch (e){
          console.log(e)
        }
    
      }  
          
    
    })
  }

  exports.getAllInterventions = async (req,res,next) => {

    try{
      const result = await Intervention.find()
      res.json({success:true, result})
    }catch(e){
      console.log(e)
    }
  }
  
