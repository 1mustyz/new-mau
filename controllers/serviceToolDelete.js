const cloudinary = require('cloudinary');
const Facility = require('../models/facility')

const cloudinarySetup = require('../middlewares/cluadinarySetup')


// cloudinary configuration for saving files
cloudinarySetup.setup()

exports.serviceToolDelete = async (serviceId,serviceToolId,req,res) => {

    const resultImage = await Facility.findOne({"service.serviceId":serviceId},{_id:0,service:1})
        const bigPromise = () => {
          const resultImageFilter = resultImage.service.filter((service)=>{
            return service.serviceId == serviceId
          })    
          
          console.log(resultImageFilter)
      
          // delete service tool image
          const serviceTool = resultImageFilter[0].serviceTools
          serviceTool.map((srvTool) => {
            console.log(srvTool)
            if(srvTool.serviceToolId == serviceToolId){
                
                if(srvTool.image != undefined && srvTool.image != null){
                  const ImageName = srvTool.image.split('/').splice(7)
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
          })
    
      
        }
        
        const myPromise = new Promise(async (resolve, reject) => {
          resolve(bigPromise())
        });
    
        myPromise.then(async ()=>{
         
            let result
    
            await Facility.findOneAndUpdate(
              {"service.serviceTools.serviceToolId":serviceToolId},
              {$pull:{"service.$[e1].serviceTools": {serviceToolId: serviceToolId}}},
              { 
                arrayFilters: [
                  {"e1.serviceId": serviceId},
                  { "e2.serviceToolId": serviceToolId}],
              }
              )
            result = await Facility.findOne({"service.serviceId":serviceId})
            res.json({success: true, message: `ServiceTool with the ID ${serviceToolId} has been removed`, result})
        })
}

