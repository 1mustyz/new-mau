const cloudinary = require('cloudinary');

const cloudinarySetup = require('../middlewares/cluadinarySetup')


// cloudinary configuration for saving files
cloudinarySetup.setup()

exports.interventionListDelete = async (Document,eventId,interventionId,req,res) => {

  let result


  const resultImage = await Document.findOne({"interventionList.eventId":eventId},{_id:0,interventionList:1})
    const bigPromise = () => {
        const resultImageFilter = resultImage.interventionList.filter((lst)=>{
        return lst.eventId == eventId
        })   
          
          console.log(resultImageFilter)
          
            if(resultImageFilter[0].image != null){
                // console.log('222222','hshsisi')
                
                
                  const imageName = resultImageFilter[0].image.split('/').splice(7)
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
    }
        
        const myPromise = new Promise(async (resolve, reject) => {
          resolve(bigPromise())
        });
    
        myPromise.then(async ()=>{
         
          console.log(result)
          await Document.findOneAndUpdate({"interventionList.eventId":eventId},{$pull:{"interventionList":{"eventId":eventId}}})
          result = await Document.findOne({"interventionId":interventionId})
          res.json({success: true, message: `Event with the ID ${eventId} has been removed`, result})
        })
}

