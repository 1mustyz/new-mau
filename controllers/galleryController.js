const Gallery = require('../models/gallery')
const randomstring = require("randomstring");
const fs = require('fs')
const { singleUpload, singleFileUpload, singleAllMediaUpload } = require('../middlewares/filesMiddleware')
const multer = require('multer')
const cloudinary = require('cloudinary');
const cloudinarySetup = require('../middlewares/cluadinarySetup');

// cloudinary configuration for saving files
cloudinarySetup.setup()

// Add gallery
exports.addGallery = async (req,res,next) => {
    const {data} = req.body
    data.galleryId = randomstring.generate(8)
  
    try{
        await Gallery.collection.insertOne(data)
        const result = await Gallery.find()
        
        res.json({success: true, message: 'Gallery created successfullty', result, newlyEvent:data});
    }catch(e){
        console.log(e)
    }
  
} 
  // edit gallery
exports.editGallery = async (req,res,next) => {
    const {galleryId,data} = req.body;
    try{

        await Gallery.findOneAndUpdate({galleryId},data,{new:true})
        const result = await Gallery.find()
      
        res.json({success: true, editedEvent:data, result})
    }catch(e){
        console.log(e)
    }
  
  }

  // exports.getSingleMainEvents = async (req,res,next) => {
  //   const {galleryId} = req.query
  
  //   try{
  //     const singleMainEvent = await Gallery.aggregate([
  //       {$match:{"mainEvents.galleryId": eventId}},
  //       {$project: {mainEvents:1,_id:0}},
  //       {$unwind: "$mainEvents"},
  //       {$match:{"mainEvents.galleryId": eventId}},
  //     ])
  //     res.json({success:true, result: singleMainEvent[0].mainEvents})
  //   }catch(e){
  //     console.log(e)
  //   }
    
  // }

  // delete or remove gallery
exports.removeGallery = async (req,res,next) => {
    const {galleryId} = req.query;
    const result = await Gallery.findOne({galleryId},{_id: 0,image: 1})

    console.log(result)
    const imageName = result.image.split('/').splice(7)
      console.log('-----------------',imageName)
  
        cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
      {
        invalidate: true,
          resource_type: "raw"
      }, 
      function(error,result) {
        console.log('33333333',result, error)
      });  
  
  
    await Gallery.findOneAndDelete({galleryId})
    res.json({success: true, message: `Gallery with the id ${galleryId} has been removed`})
  }
  

  exports.getGallery = async (req,res, next) => {
    try {
      const result = await Gallery.find({});
      result.length > 0
       ? res.json({success: true, message: result,})
       : res.json({success: false, message: result,})
      
    } catch (error) {
      res.json({success: false, error})
      
    }
  }  

  // Add gallery pic
exports.addGalleryImage = async (req,res, next) => {
    const {galleryId} = req.query
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
                const result = await Gallery.findOne({galleryId},{_id: 0,image: 1})
        
                console.log(result)
                
               
                if(result.image != undefined || result.image != null){
                // console.log('222222','hshsisi')
        
                
                const imageName = result.image.split('/').splice(7)
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
        
                    await Gallery.findOneAndUpdate({galleryId},{$set: {"image": result.secure_url}},{new:true})
                    allResults = await Gallery.find({})
                
                res.json({success: true,message: allResults,});
                });
          
        } catch (error) {
          console.log(error)
        }
       
      }
    });
    
      
          
    
}