const cloudinary = require('cloudinary');
// cloudinary configuration for saving files
cloudinary.config({
    cloud_name: 'mustyz',
    api_key: '727865786596545',
    api_secret: 'HpUmMxoW8BkmIRDWq_g2-5J2mD8'
})

// this function returns the image path after upload
exports.upload = async (filePath)=>{
    let resultt
    try {
        await cloudinary.v2.uploader.upload(filePath, 
            { resource_type: "raw" }, 
            async function(error, result) {
                // you can log the result or error
              resultt = result.secure_url
          })
          return resultt
        
    } catch (error) {
        console.log(error)
    }
}

// this function returns the true if image is deleted successfully
exports.delete = async (image) => {
    const imageName = image.split('/').splice(7)
    try {
        cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
            {
              invalidate: true,
                resource_type: "raw"
            }, 
              function(error,result) {
                // you can log the result or error
            });
            return true
    } catch (error) {
        console.log(error)
    }

   
}