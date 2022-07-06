const cloudinary = require('cloudinary');

const cloudinarySetup = require('../middlewares/cluadinarySetup')


// cloudinary configuration for saving files
cloudinarySetup.setup()

exports.serviceDelete = async (Document,serviceId,facilityId,req,res) => {

  let result


    const resultImage = await Document.findOne({"service.serviceId":serviceId},{_id:0,service:1})
        const bigPromise = () => {
          const resultImageFilter = resultImage.service.filter((service)=>{
            return service.serviceId == serviceId
          })    
          
          console.log(resultImageFilter)
      
          // delete all service tools  brochure
          const serviceTool = resultImageFilter[0].serviceTools
          serviceTool.map((srvTool) => {
            console.log(srvTool)
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
          })
    
      
        }
        
        const myPromise = new Promise(async (resolve, reject) => {
          resolve(bigPromise())
        });
    
        myPromise.then(async ()=>{
         
          console.log(result)
          await Document.findOneAndUpdate({"service.serviceId":serviceId},{$pull:{"service":{"serviceId":serviceId}}})
          result = await Document.findOne({"facilityId":facilityId})
          res.json({success: true, message: `Service with the ID ${serviceId} has been removed`, result})
        })
}

