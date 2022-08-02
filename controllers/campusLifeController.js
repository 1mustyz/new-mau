const CampusLife = require('../models/campusLife')
const randomstring = require("randomstring");
const fs = require('fs')
const { singleUpload, singleFileUpload, singleAllMediaUpload } = require('../middlewares/filesMiddleware')
const multer = require('multer')
const cloudinary = require('cloudinary');
const cloudinarySetup = require('../middlewares/cluadinarySetup');

// cloudinary configuration for saving files
cloudinarySetup.setup()

// Add main event
exports.addCampusLife = async (req,res,next) => {
    const {data,campusLifeType} = req.body
    data.evntId = randomstring.generate(8)
    data.dateEntered = new Date()
    const campusLife = await CampusLife.find()
    let result
    
    if (campusLife.length == 0){
      await CampusLife.collection.insertOne({
        "dean" : [],
        "mainSlide": [],
        "bodySlide": [],
      })
    }
  
  
    if(campusLifeType == "dean"){
      result = await CampusLife.findOneAndUpdate({},{$set:{[campusLifeType]:data}},{new:true})
    }else{
  
      result = await CampusLife.findOneAndUpdate({},{$push:{[campusLifeType]:data}},{new:true})
    }
  
    res.json({success: true, message: 'CampusLife created successfullty', result, newlyEvent:data});
  }
  
  // edit event
exports.editCampusLife = async (req,res,next) => {
    let allEvents
    const {eventId,evnt,eventName} = req.body;
    if(eventName == "mainSlide"){
  
      allEvents = await CampusLife.findOneAndUpdate({"mainSlide.evntId": eventId},{$set: {
        "mainSlide.$.header": evnt.header, 
        "mainSlide.$.description": evnt.description, 
          
      }},{new:true})
  
    }else if(eventName == "bodySlide"){
      allEvents = await CampusLife.findOneAndUpdate({"bodySlide.evntId": eventId},{$set: {
        "bodySlide.$.header": evnt.header,
        "bodySlide.$.description": evnt.description,
      }},{new:true})
    }else{
    res.json({success: false, message: `wrong parameters`})
  
    }
    const result = await CampusLife.findOne({},{_id: 0,[eventName]: 1})
          
      const resultFilter = result[eventName].filter((evnt)=>{
        return evnt.evntId == eventId
      })
  
    res.json({success: true, allEvents,editedEvent:resultFilter})
  }

  // exports.getSingleMainEvents = async (req,res,next) => {
  //   const {eventId} = req.query
  
  //   try{
  //     const singleMainEvent = await CampusLife.aggregate([
  //       {$match:{"mainEvents.evntId": eventId}},
  //       {$project: {mainEvents:1,_id:0}},
  //       {$unwind: "$mainEvents"},
  //       {$match:{"mainEvents.evntId": eventId}},
  //     ])
  //     res.json({success:true, result: singleMainEvent[0].mainEvents})
  //   }catch(e){
  //     console.log(e)
  //   }
    
  // }

  // delete or remove campusLife event
exports.removeCampusLifeEvent = async (req,res,next) => {
    const {eventName,eventId} = req.query;
    const result = await CampusLife.findOne({},{_id: 0,[eventName]: 1})
          
    const resultFilter = result[eventName].filter((evnt)=>{
      return evnt.evntId == eventId
    })
  
    const imageName = resultFilter[0].image.split('/').splice(7)
      console.log('-----------------',imageName)
  
        cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
      {
        invalidate: true,
          resource_type: "raw"
      }, 
      function(error,result) {
        console.log('33333333',result, error)
      });  
  
  
    await CampusLife.findOneAndUpdate({evntId:eventId},{$pull:{[eventName]:{evntId: eventId}}})
    res.json({success: true, message: `Event with the id ${eventId} has been removed`})
  }
  

  exports.getCampusLife = async (req,res, next) => {
    try {
      const result = await CampusLife.find({});
      result.length > 0
       ? res.json({success: true, message: result,})
       : res.json({success: false, message: result,})
      
    } catch (error) {
      res.json({success: false, error})
      
    }
  }  

  // Add event pic
exports.addCampusLifeImage = async (req,res, next) => {
    const {eventName,eventId} = req.query
    let allResults
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
            if (eventName != "dean"){
                const result = await CampusLife.findOne({},{_id: 0,[eventName]: 1})
        
                console.log(result)
                
                const resultFilter = result[eventName].filter((evnt)=>{
                return evnt.evntId == eventId
                })
                console.log(resultFilter[0].image)
                if(resultFilter[0].image != undefined || resultFilter[0].image != null){
                // console.log('222222','hshsisi')
        
                
                const imageName = resultFilter[0].image.split('/').splice(7)
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
        
                if(eventName == "mainSlide"){
        
                    allResults = await CampusLife.findOneAndUpdate({"mainSlide.evntId": eventId},{$set: {"mainSlide.$.image": result.secure_url}},{new:true})
                }else if(eventName == "bodySlide"){
                    allResults = await CampusLife.findOneAndUpdate({"bodySlide.evntId": eventId},{$set: {"bodySlide.$.image": result.secure_url}},{new:true})
                }else{
                    res.json({success: false, message:"used of wrong parameters and queries"})
                }  
                // const editedStaff = await Staff.findOne({username: req.query.username})
                
                res.json({success: true,
                    message: allResults,
                            },
                
                );
                });
  
            }else{
                const result = await CampusLife.findOne({},{_id: 0,[eventName]: 1})
                
               
                console.log(result[eventName].image)
                if(result[eventName].image != undefined){
                // console.log('222222','hshsisi')
        
                  
                  const imageName = result[eventName].image.split('/').splice(7)
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
        
                  allResults = await CampusLife.findOneAndUpdate({},{$set: {"dean.image": result.secure_url}},{new:true})
        
                 
                  
                  res.json({success: true,
                    message: allResults,
                              },
                  
                  );
                });
             
        
        
              }
  
                   
           
          
        } catch (error) {
          console.log(error)
        }
       
      }
    });
    
      
          
    
  }