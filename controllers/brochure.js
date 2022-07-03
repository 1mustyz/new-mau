const {singleFileUpload} = require('../middlewares/filesMiddleware');
const multer = require('multer');
const cloudinary = require('cloudinary');

const cloudinarySetup = require('../middlewares/cluadinarySetup')


// cloudinary configuration for saving files
cloudinarySetup.setup()


exports.addBrochure = async(Document,activity,entityId,departmentId,req,res) => {
    singleFileUpload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
        return res.json(err.message);
        }
        else if (err) {
          return res.json(err);
        }
        else if (!req.file) {
          return res.json({"file": req.file, "msg":'Please select a file to upload'});
        }
        if(req.file){
          if(req.file.size > 10000000) return res.json({success: false, message:'File size should not be greater 10mb'})
    
          let dResult = []
          let pResult = []
          let result

          if(activity == "center"){
            result = await Document.findOne({"programs.programId":entityId},{programs:1})
            console.log(result)
            dResult.push(result.programs)
            console.log(dResult)

          }else{

            result = await Document.findOne({"departmentList.programs.programId":entityId},{departmentList:1})
            console.log(result)
            result.departmentList.filter(dpt => {
              if(dpt.departmentId == departmentId){
                dResult.push(dpt.programs) 
              }
              
            })
            console.log(dResult)
          }
    
             dResult[0].map(prm => {
              if(prm.programId == entityId) pResult.push(prm)
            })
            console.log(pResult.brochure)
  
    
            if (pResult[0].brochure != undefined && pResult[0].brochure != null){
              const brochureName = pResult[0].brochure.split('/').splice(7)
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
    
    
          cloudinary.v2.uploader.upload(req.file.path, 
            { resource_type: "raw" }, 
            async function(error, result) {
              console.log('111111111111111111',result, error); 
      
              
             if(activity == 'center'){
              await Document.findOneAndUpdate(
                {"programs.programId":entityId},
                {$set:{
                  "programs.$.brochure":result.secure_url,
                }})
              const editedCenter = await Document.findOne({"programs.programId":entityId},{programs:1})
  
              
              res.json({success: true,message: editedCenter, });
             }else {
              await Document.findOneAndUpdate(
                {"departmentList.programs.programId":entityId},
                {$set:{
                  "departmentList.$[e1].programs.$[e2].brochure":result.secure_url,
                }},
                { 
                  arrayFilters: [
                    {"e1.departmentId": departmentId},
                    { "e2.programId": entityId}],
                })
              const editedDepartment = await Document.findOne({"departmentList.programs.programId":entityId},{"departmentList.staffList.password":0})
              
              res.json({success: true,message: editedDepartment });
             }
  
            });
         
           
        }
           
      });
    
}