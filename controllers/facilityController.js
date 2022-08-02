const Facility = require('../models/facility')
const randomstring = require("randomstring");
const { singleUpload, singleFileUpload, singleAllMediaUpload } = require('../middlewares/filesMiddleware')
const fs = require('fs')
const multer = require('multer')
const cloudinary = require('cloudinary');
const { serviceDelete } = require('./serviceDelete');
const { serviceToolDelete } = require('./serviceToolDelete');


// add facilities
exports.addFacilities = async (req,res,next) => {
    req.body.facilityId = randomstring.generate(8)
  
    try {
      await Facility.collection.insertOne(req.body,{new:true})
      const result = await Facility.find()
      res.json({success: true, result})
    } catch (error) {
      console.log(error)
    }
  }
  
  // add facility services
  exports.addFacilityService = async (req,res,next) => {
    const { service, facilityId} = req.body
    const { description } = service
    service.serviceId = randomstring.generate(8)
  
    service.description = description.map(desc => {
      return {
        value : desc,
        descriptionId : randomstring.generate(8)
        
      }
    })
    // console.log(service)
  
    try {
      await Facility.findOneAndUpdate({facilityId},{$push:{"service":service}})
      const result = await Facility.find()
  
      res.json({sucess:true, result})
  
    } catch (error) {
      console.log(error)
    }
  }
  
  // add more facility description
  exports.addMoreFacilityServiceDescription = async (req,res,next) => {
    const {serviceId, description} = req.body
    description.descriptionId = randomstring.generate(8)
    console.log(description)
  
    try {
      await Facility.findOneAndUpdate({'service.serviceId':serviceId},{$push:{'service.$.description':description}})
      const result = await Facility.find({'service.serviceId':serviceId})
      res.json({success:true,result})
    } catch (error) {
      console.log(error)
    }
  }
  
  // add facility serviceTools
  exports.addFacilityServiceTools = async (req,res,next) => {
    const {serviceId, serviceTool} = req.body
    serviceTool.serviceToolId = randomstring.generate(8)
    serviceTool.image = null
    console.log(serviceTool)
  
    try {
      await Facility.findOneAndUpdate({'service.serviceId':serviceId},{$push:{'service.$.serviceTools':serviceTool}})
      const result = await Facility.find({'service.serviceId':serviceId})
      res.json({success:true,result})
    } catch (error) {
      console.log(error)
    }
  }

  // add facility director
exports.addFaciltyDirector = async (req,res,next) => {
  const {director} = req.body
  const {facilityId} = req.query
  director.image = null
  let result

  try {
    await Facility.findOneAndUpdate({facilityId},{"director":director},{new:true})
    await Facility.findOne({facilityId},{_id:0})
  } catch (error) {
  console.log(error);
    
  }
  res.json({success: true, message: 'Facility Director created successfullty', result});
}
  
  
  // get all facilities
  exports.getAllFacilities = async (req,res,next) => {
    // console.log('hello')
  
    try {
      const result = await Facility.find()
      res.json({success: true, result})
    } catch (error) {
      console.log(error)
    }
  }
  
  exports.getSingleFacility = async (req,res,next) => {
    const { facilityId } = req.query
  
    try {
      const result = await Facility.findOne({facilityId})
      res.json({success:true,result})
    } catch (error) {
      console.log(error)
    }
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

  // edit facility
  exports.editFacility = async (req,res,next) => {
    const {facilityId} = req.query;
    try {
      await Facility.findOneAndUpdate({facilityId:facilityId}, req.body,{new:true})
    const result = await Facility.find()
  
      res.json({success: true, message: `Facility with the ID ${facilityId} has been edited`,result})
      
    } catch (error) {
      console.log(error)
    }
   
  }

  // edit facility
  exports.editFacilityService = async (req,res,next) => {
    const {serviceId} = req.query;
    const {description} = req.body
    req.body.description = description.map(desc => {
      return {
        value : desc,
        descriptionId : randomstring.generate(8)
        
      }
    })
    try {
      await Facility.findOneAndUpdate({"service.serviceId": serviceId},{$set:{
        "service.$[e1].name":req.body.name,
        "service.$[e1].description":req.body.description,

      }},
      { 
        arrayFilters: [
          {"e1.serviceId": serviceId},
        ],
      })

      result = await Facility.findOne({"service.serviceId": serviceId})
  
      res.json({success: true, result})
      
    } catch (error) {
      console.log(error)
    }
   
  }

  // delete serviceTool
exports.removeServiceTool = async (req,res,next) => {
  const {serviceId,serviceToolId} = req.query;

  try {
    await serviceToolDelete(serviceId,serviceToolId,req,res)
    
  } catch (error) {
  console.log({success: false, error})
    
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
