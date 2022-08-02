const Intervention = require('../models/intervention')
const randomstring = require("randomstring");
const { singleUpload, singleFileUpload, singleAllMediaUpload } = require('../middlewares/filesMiddleware')
const fs = require('fs')
const multer = require('multer')
const cloudinary = require('cloudinary');

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

   // delete service
exports.removeService = async (req,res,next) => {
    const {serviceId,facilityId} = req.query;
    try {
       await serviceDelete(Facility,serviceId,facilityId,req,res)
      
    } catch (error) {
    console.log({success: false, error})
      
    }
  }

  // delete or remove facility
exports.removeFacility = async (req,res,next) => {
    const {facilityId} = req.query     
    const bigPromise = async () => {
      const resultImage = await Facility.findOne({facilityId:facilityId})
      console.log(resultImage.director)
      //remove directors image
      if(resultImage.director != null && resultImage.director != undefined ){
        if(resultImage.director.image != null && resultImage.director.image != undefined ){
  
          const ImageName = resultImage.director.image.split('/').splice(7)
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
      }
  
  
      // remove service tools image
      if(resultImage.service != null && resultImage.service != undefined){
    
        if(resultImage.service.length !=0 ){
          resultImage.service.map((srv)=>{
            console.log(srv)
      
            if (srv.serviceTools != null && srv.serviceTools != undefined){
    
              if (srv.serviceTools.length != 0){
                  srv.serviceTools.map((tool) => {
                  console.log(tool)
                  if(tool.image != undefined && tool.image != null){
                    const ImageName = tool.image.split('/').splice(7)
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
            
          })
    
        }
      }
  
    }
    const myPromise = new Promise(async (resolve, reject) => {
      resolve(bigPromise())
    });
    myPromise.then(async ()=>{
           
      let result
      
      await Facility.findOneAndDelete({"facilityId":facilityId})
      result = await Facility.find()
      res.json({success: true, message: `Facility with the ID ${facilityId} has been removed`, result})
  })
  
  }

  exports.addFacilityServiceToolImage = async (req,res, next) => {
    const {serviceId,serviceToolId} = req.query
    console.log(serviceId)
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
  
            const result = await Facility.aggregate([
              {$match: {"service.serviceId": serviceId}},
              {$project: {service:1}},
              {$unwind: "$service"},
              {$match: {"service.serviceId": serviceId}},
              {$project: {tools:"$service.serviceTools"}},
              {$unwind: "$tools"},
              {$match: {"tools.serviceToolId":serviceToolId}}
            ])
    
            console.log(result[0].tools.image)
            
            if(result[0].tools.image != "null"){
            // console.log('222222','hshsisi')
    
              
              const imageName = result[0].tools.image.split('/').splice(7)
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
              // console.log('444444',result, error); 
    
              await Facility.findOneAndUpdate({"service.serviceId": serviceId},{$set:{
                "service.$[e1].serviceTools.$[e2].image":result.secure_url,
              }},
              { 
                arrayFilters: [
                  {"e1.serviceId": serviceId},
                  { "e2.serviceToolId": serviceToolId}],
              })

              allResult = await Facility.findOne({"service.serviceId": serviceId})
              
              res.json({success: true,
                message: allResults,
                          },
              
              );
            });
         
           
          
          
        }catch (e){
          console.log(e)
        }
    
      }  
          
    
    })
  }
  
