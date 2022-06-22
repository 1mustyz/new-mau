const cloudinary = require('cloudinary');

const cloudinarySetup = require('../middlewares/cluadinarySetup')


// cloudinary configuration for saving files
cloudinarySetup.setup()

exports.departmentDelete = async (Document,departmentId,facultyId,req,res) => {

  let result


    const resultImage = await Document.findOne({"departmentList.departmentId":departmentId},{_id:0,departmentList:1})
        const bigPromise = () => {
          const resultImageFilter = resultImage.departmentList.filter((dpt)=>{
            return dpt.departmentId == departmentId
          })    
          
          console.log(resultImageFilter)
      
          // delete all programs brochure
          const dptPrograms = resultImageFilter[0].programs
          dptPrograms.map((prm) => {
            console.log(prm)
            if(prm.brochure != undefined && prm.brochure != null && prm.length > 0){
              const brochureName = prm.brochure.split('/').splice(7)
                  console.log('-----------------',brochureName)
          
                  cloudinary.v2.api.delete_resources_by_prefix(brochureName[0], 
                  {
                    invalidate: true,
                    resource_type: "raw"
                }, 
                  function(error,result) {
                    console.log(result, error) 
                  }); 
            }
          })
    
           // delete all staff image
           const dptStaff = resultImageFilter[0].staffList
           dptStaff.map((stf) => {
             console.log(stf)
             if(stf.image != undefined && stf.image != null && stf.length > 0){
               const imageName = stf.image.split('/').splice(7)
                   console.log('-----------------',imageName)
           
                   cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
                   {
                     invalidate: true,
                     resource_type: "raw"
                 }, 
                   function(error,result) {
                     console.log(result, error) 
                   }); 
             }
           })
           
           console.log(resultImageFilter)
          // delete hod image from server
          if(resultImageFilter[0].hod != null){
              if(resultImageFilter[0].hod.image != null) {
                  
                  const imageName = resultImageFilter[0].hod.image.split('/').splice(7)
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
            // console.log('222222','hshsisi')
            
            
          }
      
          // delete department image from server
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
          await Document.findOneAndUpdate({"departmentList.departmentId":departmentId},{$pull:{"departmentList":{"departmentId":departmentId}}})
          result = await Document.findOne({"facultyId":facultyId})
          res.json({success: true, message: `Department with the ID ${departmentId} has been removed`, result})
        })
}

