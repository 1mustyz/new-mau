/* eslint-disable no-debugger, no-console */
const Staff = require('../models/staff')
const passport = require('passport');
const Faculty = require('../models/faculty')
const College = require('../models/college')
const School = require('../models/school')
const Center = require('../models/center')
const Unit = require('../models/unit')
const Facility = require('../models/facility')
const About = require('../models/about')
const Downloadable = require('../models/downloadable')
const PortalLink = require('../models/portalsLink')
const multer = require('multer')
const { singleUpload, singleFileUpload, singleAllMediaUpload } = require('../middlewares/filesMiddleware')
const { uuid } = require('uuidv4');
const jwt =require('jsonwebtoken');
const csv = require('csv-parser')
const fs = require('fs')
const math = require('../middlewares/math.middleware')
const randomstring = require("randomstring");
const cloudinary = require('cloudinary');
const mailgun = require("mailgun-js");
const HomePage = require('../models/homePage');
const DOMAIN = "sandbox09949278db4c4a108c6c1d3d1fefe2ff.mailgun.org";
const mg = mailgun({apiKey: "9bd20544d943a291e8833abd9e0c9908-76f111c4-8a189b96", domain: DOMAIN});
const bcrypt = require('bcrypt');
const broc = require('./brochure')
const { departmentDelete } = require('./deleteDepartment')
const cloudinarySetup = require('../middlewares/cluadinarySetup');

const { paginatedResults } = require('./pagination');
const portalLinks = require('../models/portalsLink');
const cloudinaryUplouder = require('../middlewares/uploadCloudinary')



// cloudinary configuration for saving files
cloudinarySetup.setup()

exports.mall = async (req,res,next) => {
  cloudinary.v2.api.delete_resources_by_prefix('bc7crytwzlexeg8ubxt3.jpg', 
  {
    invalidate: true,
    resource_type: "raw"
}, 
  function(error,result) {
    console.log(result, error) });   

} 
// staff registration controller
exports.registerStaff = async (req, res, next) => {
    try {

      //create the user instance
      user = new Staff(req.body)
      const password = req.body.password ? req.body.password : 'password'
      //save the user to the DB
      await Staff.register(user, password, function (error, user) {
        if (error) return res.json({ success: false, error }) 
        const newUser = {
          _id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        const data = {
          from: "MAU@gmail.com",
          to: "onemustyfc@gmail.com",
          subject: "MAU DEFAULT PASSWORD",
          text: "Your default password is 'password'"
        };
        try {
          
          mg.messages().send(data, function (error, body) {
            console.log(body);
          });
          res.json({ success: true, newUser })
        } catch (error) {
          res.json({ success: false, newUser })
        }
      })
    } catch (error) {
      res.json({ success: false, error })
    }
  }

  // reset password
  exports.changePassword = async (req, res, next) => {
    const {username} = req.query
    Staff.findOne({ username },(err, user) => {
      // Check if error connecting
      if (err) {
        res.json({ success: false, message: err }); // Return error
      } else {
        // Check if user was found in database
        if (!user) {
          res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
        } else {
          user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
             if(err) {
                      if(err.name === 'IncorrectPasswordError'){
                           res.json({ success: false, message: 'Incorrect password' }); // Return error
                      }else {
                          res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                      }
            } else {
              res.json({ success: true, message: 'Your password has been changed successfully' });
             }
           })
        }
      }
    });
  }

exports.forgetPassword = async (req,res,next) => {

  const newPassword = math.randomNumber()
  try {

      const user = await Staff.findOne({
        username: req.query.username
    });
    await user.setPassword(newPassword.toString());
    const updatedUser = await user.save();
    const data = {
      from: "MAU@gmail.com",
      to: "onemustyfc@gmail.com",
      subject: "CHANGED PASSWORD",
      text: `Your new password is ${newPassword}`
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });
    res.json({success:true, message:"Password have been reset and sent to email"})
  } catch (error) {
    res.json({success:false, message:error})
  }
    
}

  // staff login controller
exports.loginStaff = (req, res, next) => {

  let payLoad = {}
  // perform authentication
  passport.authenticate('staff', (error, user, info) => {
    if (error) return res.json({ success: false, error })
    if (!user)
      return res.json({
        success: false,
        message: 'username or password is incorrect'
      })
    //login the user  
    req.login(user, (error) => {
      if (error){
        res.json({ success: false, message: 'something went wrong pls try again' })
      }else {
        req.session.user = user
        payLoad.id = user.username
        const token = jwt.sign(payLoad, 'myVerySecret');

        const newUser = {
          token: token,
          _id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        
        res.json({ success: true, message: 'staff login successful', newUser})
      }
    })
  })(req, res, next)
}

 

// logout
exports.logout = (req, res,next) => {

  console.log(req.session)

  if (req.session.user.role == "admin"){

      req.logout();
      res.json({success: true, message: "logout successfully"});
  }
}

// find all staff
exports.findAllStaff = async (req,res, next) => {

  const result = await Staff.find({});
  result.length > 0
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}

// get all academy staff
exports.getDepartmentAcademyStaff = async (req,res,next) => {
  const {targetId, activity, } = req.query

  const getStaff = async (Document,activity) => {
    let result
    try {
      if(activity == "center" ){
        result = await Document.aggregate([
          {$match:{"centerId":targetId}},
          {$project: {staffList:1, _id:0}},
    
        ])
      }else if(activity == "unit"){
        result = await Document.aggregate([
          {$match:{"unitId":targetId}},
          {$project: {staffList:1, _id:0}},
    
        ])
      }else{

        result = await Document.aggregate([
          {$match:{"departmentList.departmentId":targetId}},
          {$project: {departmentList:1, _id:0}},
          {$unwind: "$departmentList"},
          {$match:{"departmentList.departmentId":targetId}},
          {$project: {staffList:"$departmentList.staffList"}},
    
        ])
      }
  
      res.json(result)
    } catch (error) {
      console.log(error)
    }
  }

  try {
   
    if(activity == "faculty")  getStaff(Faculty,activity)
    else if (activity == "school") getStaff(School,activity)
    else if (activity == "college") getStaff(College,activity)
    else if (activity == "center") getStaff(Center,activity)
    else if (activity == "unit") getStaff(Unit,activity)
    else {
      res.json({success:false, message: 'Wrong parameters'})
    }
  } catch (error) {
    console.log(error)
  }
} 


// find single staff
exports.singleStaff = async (req,res, next) => {
  const {username} = req.query

  const result = await Staff.findOne({username: username});
  result
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}

// set profile pic
exports.setProfilePic = async (req,res, next) => {

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

      // console.log(Object.keys(req.query).length)
      // try {
      //   fs.unlinkSync(req.file.path)
      //   //file removed
      // } catch(err) {
      //   console.error(err)
      // }

        const result = await Staff.findOne({username: req.query.username},{_id: 0,image: 1})
        

        if (result.image != null){
          const imageName = result.image.split('/').splice(7)
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

          
      
           
          

      cloudinary.v2.uploader.upload(req.file.path, 
        { resource_type: "raw" }, 
        async function(error, result) {
        console.log('111111111111111111',result, error); 

        
        await Staff.findOneAndUpdate({username: req.query.username},{$set: {image: result.secure_url}})
        const editedStaff = await Staff.findOne({username: req.query.username})
        
        res.json({success: true,
          message: editedStaff,
                     },
        
    );
        });
     
       
    }
       
    });

    
        
  
}

// delete or remove staff
exports.removeStaff = async (req,res,next) => {
  const { username } = req.query;
  await Staff.findOneAndDelete({username: username})
  res.json({success: true, message: `staff with the id ${username} has been removed`})
}

// edit staff
exports.editStaff = async (req,res,next) => {
  const {username} = req.query;
  await Staff.findOneAndUpdate({username: username}, req.body)
  res.json({success: true, message: `staff with the username ${username} has been edited`})
}


/**** HOMEPAGE START HERE     ****//////////////////////////////////////////////

// Add main event
exports.addHomeEvent = async (req,res,next) => {
  const {evnt,homeEventType} = req.body
  evnt.evntId = randomstring.generate(8)
  evnt.dateEntered = new Date()
  const homePage = await HomePage.find()
  let result
  
  if (homePage.length == 0){
    await HomePage.collection.insertOne({
      "mainEvents" : [],
      "newsEvents": [],
      "programs": [],
      "vc": {},
      "quickLinks": []
    })
  }


  if(homeEventType == "vc"){
    result = await HomePage.findOneAndUpdate({},{$set:{[homeEventType]:evnt}},{new:true})
  }else{

    result = await HomePage.findOneAndUpdate({},{$push:{[homeEventType]:evnt}},{new:true})
  }

  res.json({success: true, message: 'Event created successfullty', result, newlyEvent:evnt});
}

// add downloadable
exports.addDownloadable = async(req,res,next) => {
  singleAllMediaUpload(req, res, async function(err) {
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
      if(req.file.mimetype == 'application/pdf'){

        // console.log(req.file,req.body)
        try {
          cloudinary.v2.uploader.upload(req.file.path, 
            { resource_type: "raw" }, 
            async function(error, result) {
              // console.log('111111111111111111',result, error); 
              req.body.downloadLink = result.secure_url
              req.body.downloadId = randomstring.generate(8)
              await Downloadable.collection.insertOne(req.body,{new:true})
              const data = await Downloadable.find({})
              res.json({success:true, message:data})
    
            });
          
        } catch (error) {
          console.log(error)
        }
      }else{
        res.json({success:false, message: "please only upload pdf document"})

      }
     
       
    }
       
  });

}

// get paginated download
exports.getAllDownloadsWithPagination = async (req, res, next) => {
  const {page,limit} = req.query
  let result
  try{
    const allDownloads = await Downloadable.find({},{_id:0,createdAt:0,updatedAt:0,__v:0})
    if (limit === "All"){
      result = allDownloads.reverse()
    }else{
      result = paginatedResults(allDownloads.reverse(),page,limit)
    }
    res.json({success: true, page,limit, result})
  }catch(e){

  }
}

// delete downloadable
exports.deleteDownloadable = async (req,res,next) => {
  const { downloadId } = req.query

  try{
    const download = await Downloadable.findOne({downloadId})
    const downloadName = download.downloadLink.split('/').splice(7)
    console.log('-----------------',downloadName)

    cloudinary.v2.api.delete_resources_by_prefix(downloadName[0], 
    {
      invalidate: true,
      resource_type: "raw"
  }, 
    function(error,result) {
      console.log(result, error) 
    });
    await Downloadable.findOneAndDelete(downloadId)
    const result = await Downloadable.find()
    res.json({success:true,result})

  }catch(e){
    console.log(e)
  }

}

// add portal links
exports.addPortalLinks = async (req,res,next) => {
  let { portals } = req.body
  portals = portals.map(portal => {
    portal.portalId = randomstring.generate(8)
    return portal
  })

  try{
    await PortalLink.insertMany(portals,{new:true})
    const result = await PortalLink.find()
    res.json({success: true, result})
  }catch(e){
    console.log(e)
  }
}

// get paginated portals
exports.getAllPortalsWithPagination = async (req, res, next) => {
  const {page,limit} = req.query
  let result
  try{
    const allPortals = await PortalLink.find({},{_id:0,createdAt:0,updatedAt:0,__v:0})
    if(limit === "All"){
      result = allPortals.reverse()
    }else{
      result = paginatedResults(allPortals.reverse(),page,limit)
    }
    res.json({success: true, page,limit, result})
  }catch(e){
    console.log(e)
  }
}

// edit portals links
exports.editPortalLink = async (req,res,next) => {
  const { portal,portalId } = req.body

  try{

    await PortalLink.findOneAndUpdate({portalId:portalId},portal)
    const result = await PortalLink.find()
    res.json({success:true, result})
  }catch(e){
    console.log(e)
  }
}


// delete portal links
exports.deletePortalLink = async (req,res,next) => {
  const { portalId } = req.query

  try{
    await PortalLink.findOneAndDelete(portalId)
    const result = await PortalLink.find()
    res.json({success:true,result})

  }catch(e){
    console.log(e)
  }

}

exports.getHomeEvent = async (req,res, next) => {
  try {
    const result = await HomePage.find({});
    result.length > 0
     ? res.json({success: true, message: result,})
     : res.json({success: false, message: result,})
    
  } catch (error) {
    res.json({success: false, error})
    
  }
}

exports.getStatistics = async (req,res,next) => {

  try {

    const statisticsGenerator = async(Document,entityId) =>{
      return await Document.aggregate([
        {$match:{}},
        {$project:{_id:0,[entityId]:1}},
        {$count:"NumberOfCount"},
      ])

    }

    const departmentCount = async (Document) => {
      return await Document.aggregate([
        {$match:{}},
        {$project:{_id:0,"departmentList.departmentId":1}},
        {$unwind:"$departmentList"},
        {$project:{"departmentId":"$departmentList.departmentId"}},
        {$count:"NumberOfCount"},
      ])
    }

    const programCount = async (Document,activity) => {

      if(activity == 'center' || activity == 'unit'){

        return await Document.aggregate([
          {$match:{}},
          {$project:{_id:0,"programs":1}},
          {$unwind:"$programs"},
          {$project:{"programId":"$programs.programId"}},
          {$count:"NumberOfCount"},
        ])
      }else{
        return await Document.aggregate([
          {$match:{}},
          {$project:{_id:0,"departmentList.programs":1}},
          {$unwind:"$departmentList"},
          {$project:{"program":"$departmentList.programs"}},
          {$unwind:"$program"},
          {$project:{"programId":"$program.programId"}},
          {$count:"NumberOfCount"},
        ])
      }
    }

    const faculty = await statisticsGenerator(Faculty,"facultyId")
    const college = await statisticsGenerator(College,"collegeId")
    const school = await statisticsGenerator(School,"schoolId")
    const center = await statisticsGenerator(Center,"centerId")
    const unit = await statisticsGenerator(Unit,"unitId")


    let facultyDepartmentList = await departmentCount(Faculty)
    let collegeDepartmentList = await departmentCount(College)
    let schoolDepartmentList = await departmentCount(School)

    console.log(collegeDepartmentList,schoolDepartmentList)

    console.log(faculty,unit)

    const result = await [
      {
        name:'faculties',
        count:faculty.length > 0 ? faculty[0]['NumberOfCount'] : 0
      },
      {
        name:'colleges',
        count:college.length > 0 ? college[0]['NumberOfCount'] : 0
      },
      {
        name:'schools',
        count:school.length > 0 ? school[0]['NumberOfCount'] : 0
      },
      {
        name:'centers',
        count:center.length > 0 ? center[0]['NumberOfCount'] : 0
      },
      {
        name:'units',
        count:unit.length > 0 ? unit[0]['NumberOfCount'] : 0
      }]
    const departmentList = await {
      NumberOfCount: (facultyDepartmentList.length > 0 ? facultyDepartmentList[0]['NumberOfCount'] : facultyDepartmentList = 0) 
      + (collegeDepartmentList.length > 0 ? collegeDepartmentList[0]['NumberOfCount']  : collegeDepartmentList = 0)
      + (schoolDepartmentList.length > 0 ? schoolDepartmentList[0]['NumberOfCount']  : schoolDepartmentList = 0),
      faculty:facultyDepartmentList.length > 0 ? facultyDepartmentList[0]['NumberOfCount'] : facultyDepartmentList = 0, 
      college:collegeDepartmentList.length > 0 ? collegeDepartmentList[0]['NumberOfCount']  : collegeDepartmentList = 0, 
      school:schoolDepartmentList.length > 0 ? schoolDepartmentList[0]['NumberOfCount']  : schoolDepartmentList = 0}
    // console.log()

    let facultyProgramList = await programCount(Faculty)
    let collegeProgramList = await programCount(College)
    let schoolProgramList = await programCount(School)
    let centerProgramList = await programCount(Center,'center')
    let unitProgramList = await programCount(Unit,'unit')


    const programList = await {
      NumberOfCount: (facultyProgramList.length > 0 ? facultyProgramList[0]['NumberOfCount'] : facultyProgramList = 0)
      +(collegeProgramList.length > 0 ? collegeProgramList[0]['NumberOfCount']  : collegeProgramList = 0)
      +(schoolProgramList.length > 0 ? schoolProgramList[0]['NumberOfCount']  : schoolProgramList = 0)
      +(centerProgramList.length > 0 ? centerProgramList[0]['NumberOfCount'] : centerProgramList = 0)
      +(unitProgramList.length > 0 ? unitProgramList[0]['NumberOfCount'] : unitProgramList = 0),

      faculty:facultyProgramList.length > 0 ? facultyProgramList[0]['NumberOfCount'] : facultyProgramList = 0, 
      college:collegeProgramList.length > 0 ? collegeProgramList[0]['NumberOfCount']  : collegeProgramList = 0,
      school:schoolProgramList.length > 0 ? schoolProgramList[0]['NumberOfCount']  : schoolProgramList = 0,
      program: centerProgramList.length > 0 ? centerProgramList[0]['NumberOfCount'] : centerProgramList = 0
    }

    res.json({success:true, result:[...result,{name:'programmes', count: programList['NumberOfCount']}]})
    
  } catch (error) {
    console.log(error)
  }
}

// Add event pic
exports.addAnImageToEvent = async (req,res, next) => {
  const {eventName,eventId,activity,facultyId,departmentId,target,subActivity,facilityId} = req.query
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
        if(activity == "homepage"){

          const result = await HomePage.findOne({},{_id: 0,[eventName]: 1})
  
          console.log(result)
          
          const resultFilter = result[eventName].filter((evnt)=>{
            return evnt.evntId == eventId
          })
          console.log(resultFilter[0].image)
          if(resultFilter[0].image != undefined){
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
  
            if(eventName == "mainEvents"){
  
              allResults = await HomePage.findOneAndUpdate({"mainEvents.evntId": eventId},{$set: {"mainEvents.$.image": result.secure_url}},{new:true})
            }else if(eventName == "newsEvents"){
              allResults = await HomePage.findOneAndUpdate({"newsEvents.evntId": eventId},{$set: {"newsEvents.$.image": result.secure_url}},{new:true})
            }else if (eventName == "programs"){
              allResults = await HomePage.findOneAndUpdate({"programs.evntId": eventId},{$set: {"programs.$.image": result.secure_url}},{new:true})
            }else{
              res.json({success: false, message:"used of wrong parameters and queries"})
            }  
            // const editedStaff = await Staff.findOne({username: req.query.username})
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
       
         
        
        }else if(activity == "vc"){
          const result = await HomePage.findOne({},{_id: 0,[activity]: 1})
          
          // const resultFilter = result[activity].filter((evnt)=>{
          //   return evnt.evntId == eventId
          // })
          console.log(result[activity].image)
          if(result[activity].image != undefined){
          // console.log('222222','hshsisi')
  
            
            const imageName = result[activity].image.split('/').splice(7)
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
  
            allResults = await HomePage.findOneAndUpdate({},{$set: {"vc.image": result.secure_url}},{new:true})
  
           
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
       
  
  
        }else if(activity == "academics"){
          console.log(activity)
          const facultyImage = async (Document) => {
            const result = await Document.findOne({[target]:facultyId},{_id: 0,image: 1})
          
         
          console.log(result.image)
          if(result.image != null){
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
            console.log('444444',result, error); 
  
              await Document.findOneAndUpdate({[target]:facultyId},{$set: {"image": result.secure_url}},{new:true})
              let allResults 
              if(subActivity == 'center'){
                allResults = await Document.find({},{dean:0,programs:0,staffList:0})
              }else{
                allResults = await Document.find({},{dean:0,departmentList:0})
                
              }
           
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
       

          }
          if (subActivity === "faculty") await  facultyImage(Faculty);
          else if (subActivity === "college") await  facultyImage(College);
          else if (subActivity === "school") await facultyImage(School);
          else if (subActivity === "center") await facultyImage(Center);
          else {
            res.json({success: false, message: 'Wrong parameters'})
          }
  
        }else if(activity == "dean"){
          const deanImage = async (Document) => {
            const result = await Document.findOne({[target]:facultyId},{_id: 0,dean: 1})
          
         
          console.log(result.dean.image)
          if(result.dean.image != null){
          // console.log('222222','hshsisi')
  
            
          const imageName = result.dean.image.split('/').splice(7)
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
  
              await Document.findOneAndUpdate({[target]:facultyId},{$set: {"dean.image": result.secure_url}},{new:true})
              let allResults 
              if(subActivity == 'center' || subActivity == 'unit'){
                allResults = await Document.find({[target]:facultyId},{programs:0,staffList:0})
              }else{
                allResults = await Document.find({[target]:facultyId},{departmentList:0})

              }
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
  
          }

          if (subActivity === "faculty") await  deanImage(Faculty);
          else if (subActivity === "college") await  deanImage(College);
          else if (subActivity === "school") await deanImage(School);
          else if (subActivity === "center") await deanImage(Center);
          else if (subActivity === "unit") await deanImage(Unit);

          else {
            res.json({success: false, message: 'Wrong parameters'})
          }
          
        }else if(activity == "facilityDirector"){
          const result = await Facility.findOne({facilityId},{_id: 0,director: 1})
         
          console.log(result.director.image)
          if(result.director.image != null){
          // console.log('222222','hshsisi')
            
          const imageName = result.director.image.split('/').splice(7)
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
  
              await Facility.findOneAndUpdate({facilityId},{$set: {"director.image": result.secure_url}},{new:true})
              let allResults = await Facility.find({facilityId},{_id:0})

            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
  
          
        }else if(activity == "department"){
          const departmentImage = async(Document) => {
              const result = await Document.findOne({"departmentList.departmentId":departmentId},{_id: 0,departmentList:1})
            resultFilter = result.departmentList.filter((dpt)=>{
              return dpt.departmentId == departmentId
            })
            
            console.log(resultFilter[0].image)
            if(resultFilter[0].image != null){
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
    
                await Document.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set: {"departmentList.$.image": result.secure_url}},{new:true})
                const allResults = await Document.find({"departmentList.departmentId":departmentId})
            
              
              res.json({success: true,
                message: allResults,
                          },
              
              );
            });
          }

          if (subActivity === "faculty") await  departmentImage(Faculty);
          else if (subActivity === "college") await  departmentImage(College);
          else if (subActivity === "school") await departmentImage(School);
          else {
            res.json({success: false, message: 'Wrong parameters'})
          }
  
        }else if(activity == "hod"){
          console.log(activity,subActivity)
          const hodImage = async(Document) => {
              const result = await Document.findOne({"departmentList.departmentId":departmentId},{_id: 0,departmentList:1})
              resultFilter = result.departmentList.filter((dpt)=>{
                return dpt.departmentId == departmentId
              })
              console.log(resultFilter)
              console.log(resultFilter[0].hod.image)
              if(resultFilter[0].hod.image != null && resultFilter[0].hod.image != undefined){
              // console.log('222222','hshsisi')
      
                
              const imageName = resultFilter[0].hod.image.split('/').splice(7)
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
      
                  await Document.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set: {"departmentList.$.hod.image": result.secure_url}},{new:true})
                  const allResults = await Document.find({"departmentList.departmentId":departmentId})
              
                
                res.json({success: true,
                  message: allResults,
                            },
                
                );
              });

              
            }
            if (subActivity == "faculty") await  hodImage(Faculty);
            else if (subActivity == "college") await  hodImage(College);
            else if (subActivity == "school") await hodImage(School);
            else {
              res.json({success: false, message: 'Wrong parameters'})
            }
        }else if (activity === 'facility'){
            const result = await Facility.findOne({facilityId},{_id: 0,image:1})
            
            console.log(result)
            if(result.image != null){
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
              // console.log('444444',result, error); 
    
                await Facility.findOneAndUpdate({facilityId},{$set: {"image": result.secure_url}},{new:true})
                const allResults = await Facility.find({facilityId})
            
              
              res.json({success: true,
                message: allResults,
                          },
              
              );
            });

            
          
        }else {
          res.json({success: false, message: "Pls input correct activity", }, );
        }
      } catch (error) {
        console.log(error)
      }
     
    }
  });
  
    
        
  
}


// edit event
exports.editEvent = async (req,res,next) => {
  let allEvents
  const {eventId,evnt,eventName} = req.body;
  if(eventName == "mainEvents"){

    allEvents = await HomePage.findOneAndUpdate({"mainEvents.evntId": eventId},{$set: {
      "mainEvents.$.header": evnt.header, 
      "mainEvents.$.description": evnt.description, 
      "mainEvents.$.subHeader": evnt.subHeader, 
      "mainEvents.$.dayOfEvent": evnt.dayOfEvent,
      "mainEvents.$.links": evnt.links,

    }},{new:true})

  }else if(eventName == "newsEvents"){
    allEvents = await HomePage.findOneAndUpdate({"newsEvents.evntId": eventId},{$set: {
      "newsEvents.$.header": evnt.header,
      "newsEvents.$.description": evnt.description,
      "newsEvents.$.subHeader": evnt.subHeader,
      "newsEvents.$.dayOfEvent": evnt.dayOfEvent,
      "newsEvents.$.links": evnt.links,
    }},{new:true})
  }else if (eventNamee == "programs"){
    allEvents = await HomePage.findOneAndUpdate({"programs.evntId": eventId},{$set: {"programs.$.header": evnt.header, "programs.$.description": evnt.description,"programs.$.subHeader": evnt.subHeader}},{new:true})

  }else{
  res.json({success: false, message: `wrong parameters`})

  }
  const result = await HomePage.findOne({},{_id: 0,[eventName]: 1})
        
    const resultFilter = result[eventName].filter((evnt)=>{
      return evnt.evntId == eventId
    })

  res.json({success: true, allEvents,editedEvent:resultFilter})
}

exports.getSingleMainEvents = async (req,res,next) => {
  const {eventId} = req.query

  try{
    const singleMainEvent = await HomePage.aggregate([
      {$match:{"mainEvents.evntId": eventId}},
      {$project: {mainEvents:1,_id:0}},
      {$unwind: "$mainEvents"},
      {$match:{"mainEvents.evntId": eventId}},
    ])
    res.json({success:true, result: singleMainEvent[0].mainEvents})
  }catch(e){
    console.log(e)
  }
  
}

exports.getSingleProgramsEvents = async (req,res,next) => {
  const {eventId} = req.query

  try{
    const singleProgramsEvent = await HomePage.aggregate([
      {$match:{"programs.evntId": eventId}},
      {$project: {programs:1,_id:0}},
      {$unwind: "$programs"},
      {$match:{"programs.evntId": eventId}},
    ])
    res.json({success:true, result: singleProgramsEvent[0].programs})
  }catch(e){
    console.log(e)
  }
  
}

exports.getSingleNewsEvents = async (req,res,next) => {
  const {eventId} = req.query

  try{
    const singleNewsEvent = await HomePage.aggregate([
      {$match:{"newsEvents.evntId": eventId}},
      {$project: {newsEvents:1,_id:0}},
      {$unwind: "$newsEvents"},
      {$match:{"newsEvents.evntId": eventId}},
    ])
    res.json({success:true, result: singleNewsEvent[0].newsEvents})
  }catch(e){
    console.log(e)
  }
  
}


// // register a client from a file
// exports.registerClientFromAfile = async (req,res,next) => {

//   const clients = []

//   singleFileUpload(req, res, async function(err) {
//     if (err instanceof multer.MulterError) {
//     return res.json(err.message);
//     }
//     else if (err) {
//       return res.json(err);
//     }
//     else if (!req.file) {
//       return res.json({"file": req.file, "msg":'Please select file to upload'});
//     }
//     if(req.file){
//         console.log(req.file.path)

//         fs.createReadStream(req.file.path)
//         .pipe(csv({}))
//         .on('data', (data)=> clients.push(data))
//         .on('end', async () => {
//           // console.log(clients)
//           clients.map(client => {
//             client.clientId = randomstring.generate(8)
//           })
//           console.log(clients)
//           const clientes = await Client.insertMany(clients)

//           try {
//             fs.unlinkSync(req.file.path)
//             //file removed
//           } catch(err) {
//             console.error(err)
//           }
//           res.json({success:true, message: clientes})
//         })

       
//     }
//     });    


  




// }


// delete or remove homePage event
exports.removeEvent = async (req,res,next) => {
  const {eventName,eventId} = req.query;
  const result = await HomePage.findOne({},{_id: 0,[eventName]: 1})
        
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


  await HomePage.findOneAndUpdate({evntId:eventId},{$pull:{[eventName]:{evntId: eventId}}})
  res.json({success: true, message: `Event with the id ${eventId} has been removed`})
}

// add faculty
exports.addFaculty = async (req,res,next) => {
  const {entity} = req.body
  const {status} = req.query

  if (status === 'faculty') entity.facultyId = randomstring.generate(8)
  else if (status === 'college') entity.collegeId = randomstring.generate(8)
  else if (status === 'school') entity.schoolId = randomstring.generate(8)
  else if (status === 'center') entity.centerId = randomstring.generate(8)
  else if (status === 'unit') entity.unitId = randomstring.generate(8)

  
  if (status === 'center' || status === 'unit'){
    entity.programs = []
    entity.staffList = []

  }else {
    entity.departmentList = []

  }
  entity.image = null
  entity.dean = null
  let result = {}
  
  try {
    const inserter = async (Document,message) => {
      let insertedResult
      await Document.collection.insertOne(entity)

      if (status == 'center' || status === 'unit') insertedResult = await Document.find({},{dean:0, programs:0, staffList:0})
      else insertedResult = await Document.find({},{dean:0, departmentList:0})
      
      const faculty = await Faculty.find({},{_id:0, facultyName:1, facultyId:1})
      const school = await School.find({},{_id:0, schoolName:1, schoolId:1})
      const college = await College.find({},{_id:0, collegeName:1, collegeId:1})
      const center = await Center.find({},{_id:0,centerName:1, centerId:1})
      const unit = await Unit.find({},{_id:0,unitName:1, unitId:1})


      result = {faculties:faculty, schools:school, colleges:college, centers:center, units:unit}

      res.json({success: true, message, result, insertedResult});

    }
    if (status === 'faculty') inserter(Faculty,'Faculty created successfullty')
    else if (status === 'college') inserter(College,'College created successfully')
    else if (status === 'school') inserter(School, 'School created successfully')
    else if (status === 'center') inserter(Center, 'Center created successfully')
    else if (status === 'unit') inserter(Center, 'Center created successfully')

    else {
      res.json({success: false, message: 'Incorrect status'});

    }
    
  } catch (error) {
  console.log(error);
    
  }
}

// register a client from a file
exports.createFacultyFromAfile = async (req,res,next) => {
  const {activity} = req.query

  const inserter = []
  const inserterFunction = async(Document,patth) => {
    fs.createReadStream(patth)
    .pipe(csv({}))
    .on('data', (data)=> inserter.push(data))
    .on('end', async () => {
      // console.log(inserter)
      inserter.map(dct => {
        dct[`${activity}Id`] = randomstring.generate(8)
      })
      // console.log(inserter)
      await Document.insertMany(inserter)
      const documents = await Document.find({})

      try {
        fs.unlinkSync(patth)
        //file removed
      } catch(err) {
        console.error(err)
      }
      res.json({success:true, message:documents})
    })

  }

  singleFileUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (!req.file) {
      return res.json({"file": req.file, "msg":'Please select file to upload'});
    }
    if(req.file){
        console.log('-----',req.file.path)
        if (activity === "faculty") await  inserterFunction(Faculty,req.file.path);
        else if (activity === "college") await  inserterFunction(College,req.file.path);
        else if (activity === "school") await inserterFunction(School,req.file.path);
        else if (activity === "center") await inserterFunction(Center,req.file.path);
        else if (activity === "unit") await inserterFunction(Unit,req.file.path);
        else {
          res.json({success: false, message: 'Wrong parameters'})
        }
        
       
    }
    });    


}


// functiion
const getAllFacultiesOrSchoolOrCollege = async (Document, entityName, entityId ) => {
  try {
   return await Document.aggregate([
     {$match:{}},
     {$project: {"detail":{name: `$${[entityName]}` ,id:`$${[entityId]}`},_id:0}},
    //  {$project: {name:[entityName]},

   ])
  //  ({},{[entityName]:1,[entityId]:1,_id:0});
  } catch (error) {
    console.log(error)
    
  }

}


// getall faculties
exports.getAllFacultiesSchoolsCollege = async (req,res, next) => {

  
  try {
    const faculty = await getAllFacultiesOrSchoolOrCollege(Faculty, "facultyName", "facultyId")
    const school = await getAllFacultiesOrSchoolOrCollege(School, "schoolName", "schoolId")
    const college = await getAllFacultiesOrSchoolOrCollege(College, "collegeName", "collegeId")
    const center = await getAllFacultiesOrSchoolOrCollege(Center, "centerName", "centerId")
    const unit = await getAllFacultiesOrSchoolOrCollege(Unit, "unitName", "unitId")



    const result = [
      {name:'faculty' , list: faculty},
     {name:'school' , list:  school},
      {name:'college' , list: college},
     {name:'center' , list:  center},
     {name:'unit' , list:  unit}

    ]
    res.json({success: false, message: [...result]})



  } catch (error) {
    console.log(error)
    
  }
}


// find single faculty
exports.singleFaculty = async (req,res, next) => {
  const {activity,eventId,target} = req.query

  let result
  
  try {
    const value = target.match(/(.*)Id/);
    if (activity === "faculty") result = await Faculty.findOne({[target]:eventId});
    else if (activity === "college") result = await College.findOne({[target]:eventId});
    else if (activity === "school") result = await School.findOne({[target]:eventId});
    else if (activity === "center") result = await Center.findOne({[target]:eventId});
    else if (activity === "unit") result = await Unit.findOne({[target]:eventId});

    else {
      res.json({success: false, message: 'Wrong parameters'})
    }

    
    let resulty
    
    if (result){
      if (activity == "center" || activity == "unit"){
        const programList = result.programs.map((prg)=>{
          return {
            "programName":prg.programName,
            "Id":prg.Id
          }
        })

        resulty = {
          [[value[1]]+'Name']:result[`${value[1]}Name`],
          [[value[1]]+'Description']:result[`${value[1]}Description`],
           "shortNote":result.shortNote,
           "image":result.image,
           "dean":result.dean,
           [target]:result[target],
           "mission": result.mission,
           "vission": result.vission,
           "programList":programList
         }
      }else {
        const dptList = result.departmentList.map((dpt)=>{
          return {
            "departmentName":dpt.departmentName,
            "departmentId":dpt.departmentId
          }
        })
        resulty = {
         [[value[1]]+'Name']:result[`${value[1]}Name`],
         [[value[1]]+'Description']:result[`${value[1]}Description`],
          "shortNote":result.shortNote,
          "image":result.image,
          "dean":result.dean,
          [target]:result[target],
          "departmentList":dptList
        }
      }

      
      res.json({success: true, message: resulty,})
    }else res.json({success: false, message: result,})
    
    
  } catch (error) {
    console.log({success: false, error})
  }
}
// get single department
exports.getSingleDepartment = async (req,res, next) => {
  const {departmentId,activity} = req.query

  const singleDepartment = async (Document) => {
    
    let result = await Document.findOne({"departmentList.departmentId": departmentId},{departmentList:1});
    return result.departmentList.filter((dpt)=>{
      return dpt.departmentId == departmentId
    })
  }

  let result
  try {
    if (activity === "faculty") result = await singleDepartment(Faculty);
    else if (activity === "college") result = await singleDepartment(College);
    else if (activity === "school") result = await singleDepartment(School);

  } catch (error) {
    console.log(error)
  }
  
  // console.log(som)
   res.json({success: true, message: result,})
}

// get single department
exports.getSingleProgram = async (req,res, next) => {
  const {programId,activity} = req.query

    
  const singleProgram = async (Document) => {
    let data =[]
    if(activity == 'center' || activity == 'unit'){

      let result = await Document.findOne({"programs.programId": programId});
      result.programs.filter((prg)=>{
        if(prg.programId == programId) data.push(prg)
      })
      return data
    }else{
      let result = await Document.findOne({"departmentList.programs.programId": programId},{departmentList:1});
      result.departmentList.filter((dpt)=>{
        // console.log(dpt)
        dpt.programs.filter((prg)=>{
          console.log(prg)

           if(prg.programId == programId) data.push(prg)
        })
      })
       return data
  }


  }


  let result
  try {
    if (activity === "faculty") result = await singleProgram(Faculty);
    else if (activity === "college") result = await singleProgram(College);
    else if (activity === "school") result = await singleProgram(School);
    else if (activity === "center") result = await singleProgram(Center);
    else if (activity === "unit") result = await singleProgram(Unit);
    else{
      res.json({success: false, message: 'Wrong activity',})

    }

  } catch (error) {
    console.log(error)
  }
  
  // console.log(som)
   res.json({success: true, message: result,})
}  


exports.allPrograms = async (req, res, next) => {

  const findPrograms = async (Document,target,activity) => {

    if (target == 'center' || target == 'unit'){
      return await Document.aggregate([
        {$match:{}},
        {$project: {programs:1, _id:0}},
        {$unwind: {path:"$programs"}},
        {$project: {programs:{programId:"$programs.programId", name:"$programs.name", type:"$programs.type",activity:`${target}`}}},
        // {$project: {programs:"$departmentList.programs"}},
        // {$unwind: {path:"$programs"}},
    
      ])
    }

    return await Document.aggregate([
      {$match:{}},
      {$project: {departmentList:1, _id:0}},
      {$unwind: {path:"$departmentList"}},
      {$project: {programs:"$departmentList.programs"}},
      {$unwind: {path:"$programs"}},
      {$project: {programs:{programId:"$programs.programId", name:"$programs.name", type:"$programs.type",activity:`${target}`}}},
  
    ])

  } 

  let undergraduate = []
  let postgraduate = []
  let diploma = []
  let distanceLearningUnderGraduate = []
  let distanceLearningPostGraduate = []
  let sandwichUnderGraduate = []
  let preDegreeIjmb = []

  const facultyPrograms = await findPrograms(Faculty,"faculty")
  const schoolsPrograms = await findPrograms(School,"school")
  const collegePrograms = await findPrograms(College,"college")
  const centerPrograms = await findPrograms(Center,"center")
  const unitPrograms = await findPrograms(Unit,"unit")

  // console.log(centerPrograms)

  const filterPrograms = () => {
    facultyPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    schoolsPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    collegePrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    centerPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    unitPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  }

  const promise = new Promise((resolve,reject)=>{
    resolve(filterPrograms())
  })
  promise.then(()=>{
    res.json({success:true, undergraduate,postgraduate})

  })

}

exports.allSingleTypePrograms = async (req, res, next) => {
  const {type} = req.query

  const findPrograms = async (Document,target,activity) => {

    if (target == 'center' || target == 'unit'){
      return await Document.aggregate([
        {$match:{}},
        {$project: {programs:1, _id:0}},
        {$unwind: {path:"$programs"}},
        {$project: {programs:{programId:"$programs.programId", name:"$programs.name", type:"$programs.type",activity:`${target}`}}},
        // {$project: {programs:"$departmentList.programs"}},
        // {$unwind: {path:"$programs"}},
    
      ])
    }

    return await Document.aggregate([
      {$match:{}},
      {$project: {departmentList:1, _id:0}},
      {$unwind: {path:"$departmentList"}},
      {$project: {programs:"$departmentList.programs"}},
      {$unwind: {path:"$programs"}},
      {$project: {programs:{programId:"$programs.programId", name:"$programs.name", type:"$programs.type",activity:`${target}`}}},
  
    ])

  } 

  let undergraduate = []
  let postgraduate = []
  let diploma = []
  let distanceLearningUnderGraduate = []
  let distanceLearningPostGraduate = []
  let sandwichUnderGraduate = []
  let preDegreeIjmb = []

  const facultyPrograms = await findPrograms(Faculty,"faculty")
  const schoolsPrograms = await findPrograms(School,"school")
  const collegePrograms = await findPrograms(College,"college")
  const centerPrograms = await findPrograms(Center,"center")
  const unitPrograms = await findPrograms(Unit,"unit")

  // console.log(centerPrograms)

  const filterPrograms = () => {
    facultyPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    schoolsPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    collegePrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    centerPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  
    unitPrograms.forEach((prg)=>{
      // console.log()
      if (prg.programs.type == "undergraduate"){
        undergraduate.push(prg.programs)
      }else if (prg.programs.type == "postgraduate"){
        postgraduate.push(prg.programs)
      }else if (prg.programs.type == "diploma"){
        diploma.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningUnderGraduate"){
        distanceLearningUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "distanceLearningPostGraduate"){
        distanceLearningPostGraduate.push(prg.programs)
      }else if (prg.programs.type == "sandwichUnderGraduate"){
        sandwichUnderGraduate.push(prg.programs)
      }else if (prg.programs.type == "preDegreeIjmb"){
        preDegreeIjmb.push(prg.programs)
      }
    })
  }

  const promise = new Promise((resolve,reject)=>{
    resolve(filterPrograms())
  })
  promise.then(()=>{
    res.json({success:true, undergraduate,postgraduate})

  })

}


// get all department
exports.getAllDepartment = async (req,res, next) => {

  const allDepartment = async(Document,id,name,activity) => {

  return result = await Document.aggregate([
    {$match:{}},
    {$project : {_id:0, "activity":activity, [id]:1, [name]:1, department:"$departmentList"}},
    {$unwind: "$department"}
  ]);
    
  }
  try {
    const facultyDepartment = await allDepartment(Faculty,'facultyId','facultyName','faculty');
    const collegeDepartment = await allDepartment(College, 'collegeId','collegeName','college');
    const schoolDepartment = await allDepartment(School, 'schoolId', 'schoolName','school');

    res.json({success: true, message: [...facultyDepartment, ...collegeDepartment, ...schoolDepartment]})
  } catch (error) {
    console.log(error)
  }
  
}


// edit faculty
exports.editFaculty = async (req,res,next) => {
  const {entityId,activity,target} = req.query;
  const {newData} = req.body
  let result
  const editEntity = async (Document) =>{
    await Document.findOneAndUpdate({[target]:entityId}, newData,{new:true})
    return await Document.find({},{dean:0,departmentList:0})
    
  }

  try {
    if (activity == "faculty") result = await editEntity(Faculty);
    else if (activity == "college") result = await editEntity(College);
    else if (activity == "school") result = await editEntity(School);
    else if (activity == "center") result = await editEntity(Center);
    else if (activity == "unit") result = await editEntity(Unit);
    else {
    res.json({success: false, message: 'Wrong parameters'})

    }


    res.json({success: true, message: `Faculty with the ID ${entityId} has been edited`,result})
  } catch (error) {
    console.log(error)
  }
}


// delete or remove faculty
exports.removeFaculty = async (req,res,next) => {
  const {entityId,activity,target} = req.query;
  let result
  try {

    const deleteNestedDocument = async (Document) =>{
      const resultImage = await Document.findOne({[target]:entityId})

      if((activity == 'center' || activity == 'unit') && resultImage.staffList != null){
        //delete staff image
        resultImage.staffList.map((stf)=>{
  
          if (stf != null && stf.length > 0){
            if(stf.image != null && stf.image != undefined){
              const imageNameStaff = stf.image.split('/').splice(7)
              console.log('-----------------',imageNameStaff)
        
                  cloudinary.v2.api.delete_resources_by_prefix(imageNameStaff[0], 
              {
                invalidate: true,
                  resource_type: "raw"
              }, 
                function(error,result) {
                  // console.log('33333333',result, error)
              });
            }
            
          }
          
    
        })    
        //deleting programs brochure
        if(resultImage.programs != null && resultImage.programs != undefined){
          
          if (resultImage.programs.length != 0){
            resultImage.programs.map((prm) => {
              console.log(prm)
              if(prm.brochure != undefined && prm.brochure != null){
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
          }
        }
        
      }else{
        if(resultImage.departmentList != null && resultImage.departmentList != undefined){

          if(resultImage.departmentList.length !=0 ){
            resultImage.departmentList.map((dpt)=>{
              console.log(dpt)
        
              if (dpt.programs != null && dpt.programs != undefined){
    
                if (dpt.programs.length != 0){
                    dpt.programs.map((prm) => {
                    console.log(prm)
                    if(prm.brochure != undefined && prm.brochure != null){
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
                }
              }
        
              if (dpt.image != null){
                const imageNameDep = dpt.image.split('/').splice(7)
                console.log('-----------------',imageNameDep)
          
                    cloudinary.v2.api.delete_resources_by_prefix(imageNameDep[0], 
                {
                  invalidate: true,
                    resource_type: "raw"
                }, 
                  function(error,result) {
                    // console.log('33333333',result, error)
                });
              }
        
              
              console.log(dpt.hod)
              if (dpt.hod != null){
                if(dpt.hod.image != null){
                  const imageNameHod = dpt.hod.image.split('/').splice(7)
                  console.log('-----------------',imageNameHod)
            
                      cloudinary.v2.api.delete_resources_by_prefix(imageNameHod[0], 
                  {
                    invalidate: true,
                      resource_type: "raw"
                  }, 
                    function(error,result) {
                      // console.log('33333333',result, error)
                  });
                }
               
              }
              
            })
  
          }
        }


      }

      // delete faculty image from server
    if(resultImage.image != null && resultImage.image != undefined){
      // console.log('222222','hshsisi')
      
      
      const imageName = resultImage.image.split('/').splice(7)
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

    // delete dean image from server
    if(resultImage.dean != null && resultImage.dean != undefined){
      // console.log('222222','hshsisi')
      if(resultImage.dean.image != null){
        const imageName = resultImage.dean.image.split('/').splice(7)
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

    }

    
    const doDelete = async(Document) => {
      const myPromise = new Promise(async (resolve, reject) => {
        resolve(deleteNestedDocument(Document))
      });
  
  
      myPromise.then(async ()=>{
        await Document.findOneAndDelete({[target]: entityId})
        result = (activity == "center" || activity == "unit") ?  await Document.find({},{dean:0,programs:0,staffList:0}) : await Document.find({},{dean:0,departmentList:0})
        res.json({success: true, message: `Faculty with the ID ${entityId} has been removed`, result})
  
      })
    }

    if (activity == "faculty") await doDelete(Faculty);
    else if (activity == "college") await doDelete(College);
    else if (activity == "school") await doDelete(School);
    else if (activity == "center") await doDelete(Center);
    else if (activity == "unit") await doDelete(Unit);
    else{
      res.json({success: false, message:'Wrong parameters'})

    }
        
    
    // console.log(resultImageFilter)
   
  } catch (error) {
  console.log({success: false, error})
    
  }
}



// add Dean

exports.addDean = async (req,res,next) => {
  const {dean} = req.body
  const {activity,target,entityId} = req.query
  dean.image = null
  let result
  
  const createDean = async (Document) => {
    await Document.findOneAndUpdate({[target]:entityId},{"dean":dean},{new:true})
    return (activity == 'center' || activity == 'unit') 
    ? await Document.findOne({[target]:entityId},{_id:0, "staffList.password":0})
    : await Document.findOne({[target]:entityId},{_id:0, "departmentList.staffList.password":0})

  }

  try {
    if (activity == "faculty") result = await createDean(Faculty);
    else if (activity == "college") result = await createDean(College);
    else if (activity == "school") result = await createDean(School);
    else if (activity == "center") result = await createDean(Center);
    else if (activity == "unit") result = await createDean(Unit);
    else {
      res.json({success:false, message:'wrong parameters'})
    }
  } catch (error) {
  console.log(error);
    
  }
  res.json({success: true, message: 'Dean created successfullty', result});
}




// edit dean
exports.editDean = async (req,res,next) => {
  const {entityId,activity,target} = req.query;
  const {dean} = req.body
  let result

  const deanEdit = async (Document)=>{
    const din = await Document.findOne({[target]:entityId},{dean:1, _id:0})
    console.log(din)
    if (din.dean.image != null) dean.image = din.dean.image
    else dean.image = null
    return await Document.findOneAndUpdate({[target]:entityId}, {"dean":dean},{new:true})
  }

  try {
    if (activity == "faculty") result = await deanEdit(Faculty);
    else if (activity == "college") result = await deanEdit(College);
    else if (activity == "school") result = await deanEdit(School);
    else if (activity == "center") result = await deanEdit(Center);
    else if (activity == "unit") result = await deanEdit(Unit);
    else {
      res.json({success:false, message:'wrong parameters'})
    }
    
    res.json({success: true, message: `Dean from entity with the ID ${entityId} has been edited`,result})
  } catch (error) {
    console.log(error)
  }
}

// delete or remove dean
exports.removeDean = async (req,res,next) => {
  const {entityId,activity,target} = req.query;
  let result

  const deanRemove = async (Document) =>{
    const resultImage = await Document.findOne({[target]:entityId},{_id: 0,dean: 1})
        
       
        console.log(resultImage.dean.image)
        if(resultImage.dean.image != null){
        // console.log('222222','hshsisi')

          
        const imageName = resultImage.dean.image.split('/').splice(7)
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
    return await Document.findOneAndUpdate({entityId: entityId},{"dean":null},{new:true})

  }

  try {
    if (activity == "faculty") result = await deanRemove(Faculty);
    else if (activity == "college") result = await deanRemove(College);
    else if (activity == "school") result = await deanRemove(School);
    else if (activity == "center") result = await deanRemove(Center);
    else if (activity == "unit") result = await deanRemove(Unit);
    else {
      res.json({success:false, message:'Wrong parameters'})
    }
    
  } catch (error) {
  console.log(error)
    
  }
  res.json({success: true, message: `Dean from faculty with the ID ${entityId} has been removed`, result})
}

// add department
exports.addDepartment = async (req,res,next) => {
  const {department} = req.body
  const {eventId,target,activity} = req.query
  department.departmentId = randomstring.generate(8)

  let result
  const insertDepartment = async (Document) => {
   return await Document.findOneAndUpdate({[target]:eventId},{$push:{"departmentList":department}},{new:true})
  }
  
  try {
    if (activity == "faculty") result = await insertDepartment(Faculty) 
    else if (activity == "college") result = await insertDepartment(College) 
    else if (activity == "school") result = await insertDepartment(School) 
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
  } catch (error) {
    console.log(error)
    
  }
  res.json({success: true, message: 'Department created successfullty', result});
}

// register a department from a file
exports.createDepartmentFromAfile = async (req,res,next) => {
  const {activity,target,eventId} = req.query

  const inserter = []
  const inserterFunction = async(Document,patth) => {
    fs.createReadStream(patth)
    .pipe(csv({}))
    .on('data', (data)=> inserter.push(data))
    .on('end', async () => {
      // console.log(inserter)
      inserter.map(async(dct) => {
        dct[`departmentId`] = randomstring.generate(8)
        await Document.findOneAndUpdate({[target]:eventId},{$push:{"departmentList":dct}})
      })
      console.log(inserter)
      // await Document.insertMany(inserter)

      const documents = await Document.find({})

      try {
        fs.unlinkSync(patth)
        //file removed
      } catch(err) {
        console.error(err)
      }
      res.json({success:true, message:documents})
    })

  }

  singleFileUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (!req.file) {
      return res.json({"file": req.file, "msg":'Please select file to upload'});
    }
    if(req.file){
        console.log('-----',req.file.path)
        if (activity === "faculty") await  inserterFunction(Faculty,req.file.path);
        else if (activity === "college") await  inserterFunction(College,req.file.path);
        else if (activity === "school") await inserterFunction(School,req.file.path);
        else {
          res.json({success: false, message: 'Wrong parameters'})
        }
        
       
    }
    });    

}


// edit department
exports.editDepartment = async (req,res,next) => {
  const {activity,departmentId} = req.query;
  const {department} = req.body
  let result

  const editSingleDepartment = async (Document) => {
    return await Document.findOneAndUpdate(
      {"departmentList.departmentId":departmentId},
      {$set:{
        "departmentList.$.departmentName":department.departmentName,
        "departmentList.$.mission":department.mission,
        "departmentList.$.vission":department.vission,
        "departmentList.$.introduction":department.introduction

      }},{new:true})
  }

  try {
    if (activity == "faculty") result = await editSingleDepartment(Faculty)
    else if (activity == "college") result = await editSingleDepartment(College)
    else if (activity == "school") result = await editSingleDepartment(School)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
    
  } catch (error) {
    console.log(error)
  }
  res.json({success: true, message: `Department from ${activity} with the ID ${departmentId} has been edited`,result})
}

// add HOD
exports.addHod = async (req,res,next) => {
  const {hod,departmentId,activity} = req.body
  hod.image = null

  let result
  const addSingleHod = async(Document) => {
    return await Document.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set:{"departmentList.$.hod":hod}},{new:true})
    
  }
  
  try {
    if (activity == "faculty") result = await addSingleHod(Faculty)
    else if (activity == "college") result = await addSingleHod(College)
    else if (activity == "school") result = await addSingleHod(School)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }

  } catch (error) {
  console.log(error);
    
  }
  res.json({success: true, message: 'HOD created successfullty', result});
}

// add department staff
exports.addDepartmentStaff = async (req,res,next) => {
  const {activity,entityId} = req.query
  const {staff} = req.body
  const password = randomstring.generate(8)
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  staff.password = hash


  let result
  
  const createAcademicStaff = async (Document) => {

    if(activity == 'center' || activity == 'unit'){

      let target = activity+'Id'

      await Document.findOneAndUpdate({[target]:entityId},{$push:{"staffList":staff}},{new:true})
      return await Document.findOne({[target]: entityId},{_id:0,"staffList.password":0});
      
    }else{
      await Document.findOneAndUpdate({"departmentList.departmentId":entityId},{$push:{"departmentList.$.staffList":staff}},{new:true})
      let result = await Document.findOne({"departmentList.departmentId": entityId},{"departmentList.staffList.password":0});
      return result.departmentList.filter((dpt)=>{
        return dpt.departmentId == departmentId
      })
    }
    
    
  }

  try {

    if (activity == "faculty"){

      result = await createAcademicStaff(Faculty)
      res.json({success: true, message: 'Staff created successfullty', result});

    } 
    else if (activity == "college"){

      result = await createAcademicStaff(College)
      res.json({success: true, message: 'Staff created successfullty', result});

    } 
    else if (activity == "school"){

      result = await createAcademicStaff(School)
      res.json({success: true, message: 'Staff created successfullty', result});

    } 
    else if (activity == "center"){

      result = await createAcademicStaff(Center)
      res.json({success: true, message: 'Staff created successfullty', result});

    } 
    else if (activity == "unit"){

      result = await createAcademicStaff(Unit)
      res.json({success: true, message: 'Staff created successfullty', result});

    } 
    else {
      res.json({success: false, message: "Wrong parameters"});

    }

  } catch (error) {
    console.log(error)
    
  }
}

// add department programs
exports.addDepartmentProgram = async (req,res,next) => {
  const {activity,entityId} = req.query
  const {program} = req.body
  program.programId = randomstring.generate(8)

  const addProgam = async (Document) => {
    if(activity == 'center' || activity == 'unit'){
      let target = activity+'Id'
     return await Document.findOneAndUpdate({[target]:entityId},{$push:{"programs":program}},{new:true})
      
    }
    else{
      await Document.findOneAndUpdate({"departmentList.departmentId":entityId},{$push:{"departmentList.$.programs":program}},{new:true})
      let result = await Document.findOne({"departmentList.departmentId": entityId},{departmentList:1});
      return result.departmentList.filter((dpt)=>{
        return dpt.departmentId == departmentId
      })
    }
    
  }

  let result
  
  try {
    if (activity == "faculty") result = await addProgam(Faculty)
    else if (activity == "college") result = await addProgam(College)
    else if (activity == "school") result = await addProgam(School)
    else if (activity == "center") result = await addProgam(Center)
    else if (activity == "unit") result = await addProgam(Unit)

    else {
      res.json({success: false, message: "Wrong parameters"});

    }
  } catch (error) {
  console.log(error);
    
  }
  res.json({success: true, message: 'Program created successfullty', result});
}

// create programs from a file
exports.createProgranFromAfile = async (req,res,next) => {
  const {activity,entityId} = req.query

  const inserter = []
  const inserterFunction = async(Document,patth) => {
    fs.createReadStream(patth)
    .pipe(csv({}))
    .on('data', (data)=> inserter.push(data))
    .on('end', async () => {
      // console.log(inserter)
      inserter.map(async(prg) => {
        prg[`programId`] = randomstring.generate(8)
        prg['admissionRequirement'] = [ 
          {header:"admissionRequirementOlevel",
          content:prg['admissionRequirementOlevel'].toString() == ''? null : prg['admissionRequirementOlevel'].toString()},
          {header:"admissionRequirementUtme",
          content:prg['admissionRequirementUtme'].toString() == ''? null : prg['admissionRequirementUtme'].toString()},
          {header:"admissionRequirementDe",
          content:prg['admissionRequirementDe'].toString() == ''? null : prg['admissionRequirementDe'].toString()},
          {header:"admissionRequirementPg",
          content:prg['admissionRequirementPg'].toString() == ''? null : prg['admissionRequirementPg'].toString()}

        ]
        prg['graduationRequirements'] = [ prg['graduationRequirements'].toString()]
        let prgName = prg.programName.toString().split(' ').slice(1).join(" ")
        let honor = prg.programName.toString().split(' ')[0]
        let dt = {
          name: prgName,
          honor: honor,
          admissionRequirement: prg.admissionRequirement,
          careerProspect: prg.carreerProspects.toString(),
          graduationRequirement: prg.graduationRequirements,
          type: prg.programType.toString().toLowerCase(),
          programId: prg.programId.toString(),
        }
        if(activity == 'center' || activity == 'unit'){
          let target = activity+'Id'

          await Document.findOneAndUpdate({[target]:entityId},{$push:{"programs":dt}},{new:true})
         }
         else{
           await Document.findOneAndUpdate({"departmentList.departmentId":entityId},{$push:{"departmentList.$.programs":dt}},{new:true})
         }
      console.log(dt)
      })
      // await Document.insertMany(inserter)

      const documents = await Document.find({})

      try {
        fs.unlinkSync(patth)
        //file removed
      } catch(err) {
        console.error(err)
      }
      res.json({success:true, message:documents})
    })

  }

  singleFileUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (!req.file) {
      return res.json({"file": req.file, "msg":'Please select file to upload'});
    }
    if(req.file){
        console.log('-----',req.file.path)
        if (activity === "faculty") await  inserterFunction(Faculty,req.file.path);
        else if (activity === "college") await  inserterFunction(College,req.file.path);
        else if (activity === "school") await inserterFunction(School,req.file.path);
        else if (activity === "center") await inserterFunction(Center,req.file.path);
        else if (activity === "unit") await inserterFunction(Unit,req.file.path);
        else {
          res.json({success: false, message: 'Wrong parameters'})
        }
        
       
    }
  })

}



// add brochure
exports.addProgramBrochure = async (req,res,next) => {
  const {programId,departmentId,activity} = req.query

  try {
    if (activity == "faculty")  await broc.addBrochure(Faculty,activity,programId,departmentId,req,res)
    else if (activity == "college")  await broc.addBrochure(College,activity,programId,departmentId,req,res)
    else if (activity == "school")  await broc.addBrochure(School,activity,programId,departmentId,req,res)
    else if (activity == "center")  await broc.addBrochure(Center,activity,programId,departmentId,req,res)
    else if (activity == "unit")  await broc.addBrochure(Unit,activity,programId,departmentId,req,res)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
   
  } catch (error) {
  console.log({success: false, error});
    
  }
}


// edit hod
exports.editHod = async (req,res,next) => {
  const {departmentId,activity} = req.query;
  const {hod} = req.body
  let result

  const hodEdit = async (Document) => {
    
     await Document.findOneAndUpdate(
      {"departmentList.departmentId":departmentId},
      {$set:{
        "departmentList.$.hod.name":hod.name,
        "departmentList.$.hod.mail":hod.mail,
        "departmentList.$.hod.vission":hod.vission,
        "departmentList.$.hod.mission":hod.mission,
        "departmentList.$.hod.introduction":hod.introduction,


      }},{new:true})
      return await Document.findOne({"departmentList.departmentId":departmentId},{_id:0,"departmentList.staffList.password":0})

  }

  try {
    if (activity == "faculty") result = await hodEdit(Faculty)
    else if (activity == "college") result = await hodEdit(College)
    else if (activity == "school") result = await hodEdit(School)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
  } catch (error) {
    res.json({success: false, error})
  }
  res.json({success: true, message: `HOD from faculty with the ID ${departmentId} has been edited`,result})
}

// edit department program
exports.editDepartmentProgram = async (req,res,next) => {
  const {departmentId,programId,activity} = req.query;
  const {program} = req.body
  console.log(program)
  let result

  const editProgram = async (Document) => {
    if (activity == 'center' || activity == 'unit'){
      await Document.findOneAndUpdate(
        {"programs.programId":programId},
        {$set:{
          "programs.$[e2].name":program.name,
          "programs.$[e2].honor":program.honor,
          "programs.$[e2].mission":program.mission,
          "programs.$[e2].vission":program.vission,
          "programs.$[e2].admissionRequirement":program.admissionRequirement,
          "programs.$[e2].graduationRequirement":program.graduationRequirement,
          "programs.$[e2].careerProspect":program.careerProspect,

        }},
        { 
          arrayFilters: [
            { "e2.programId": programId}],
        })
  
      return await Document.findOne({"programs.programId":programId},{"staffList.password":0})
    }
    else{

      await Document.findOneAndUpdate(
        {"departmentList.programs.programId":programId},
        {$set:{
          "departmentList.$[e1].programs.$[e2].name":program.name,
          "departmentList.$[e1].programs.$[e2].honor":program.honor,
          "departmentList.$[e1].programs.$[e2].mission":program.mission,
          "departmentList.$[e1].programs.$[e2].vission":program.vission,
          "departmentList.$[e1].programs.$[e2].admissionRequirement":program.admissionRequirement,
          "departmentList.$[e1].programs.$[e2].graduationRequirement":program.graduationRequirement,
          "departmentList.$[e1].programs.$[e2].careerProspect":program.careerProspect,
        }},
        { 
          arrayFilters: [
            {"e1.departmentId": departmentId},
            { "e2.programId": programId}],
        })
  
      return await Document.findOne({"departmentList.programs.programId":programId},{"departmentList.staffList.password":0})
    }
  }

  try {
    if (activity == "faculty") result = await editProgram(Faculty)
    else if (activity == "college") result = await editProgram(College)
    else if (activity == "school") result = await editProgram(School)
    else if (activity == "center") result = await editProgram(Center)
    else if (activity == "unit") result = await editProgram(Unit)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }

    
  } catch (error) {
    console.log({success: false, error})
  }
  res.json({success: true, message: `Program from department with the ID ${departmentId} has been edited`,result})
}

// edit department staffs
exports.editDepartmentStaffs = async (req,res,next) => {
  const {departmentId,staffId,activity} = req.query;
  const {staff} = req.body
  let result

  const staffEdit= async(Document) => {
   if (activity == 'center' || activity == 'unit'){
    await Document.findOneAndUpdate(
      {"staffList.staffId":staffId},
      {$set:{
        "staffList.$[e2].name":staff.name,
        "staffList.$[e2].rank":staff.rank,
        "staffList.$[e2].major":staff.major,
        "staffList.$[e2].email":staff.email,
      }},
      { 
        arrayFilters: [
          { "e2.staffId": staffId}],
      }
      )
      return await Document.findOne({"staffList.staffId":staffId},{"staffList.password":0})
   }else{
    await Document.findOneAndUpdate(
      {"departmentList.staffList.staffId":staffId},
      {$set:{
        "departmentList.$[e1].staffList.$[e2].name":staff.name,
        "departmentList.$[e1].staffList.$[e2].rank":staff.rank,
        "departmentList.$[e1].staffList.$[e2].major":staff.major,
        "departmentList.$[e1].staffList.$[e2].email":staff.email
      }},
      { 
        arrayFilters: [
          {"e1.departmentId": departmentId},
          { "e2.staffId": staffId}],
      }
      )
      return await Document.findOne({"departmentList.staffList.staffId":staffId},{"departmentList.staffList.password":0})
   }
    
  }

  try {
    if (activity == "faculty") result = await staffEdit(Faculty)
    else if (activity == "college") result = await staffEdit(College)
    else if (activity == "school") result = await staffEdit(School)
    else if (activity == "center") result = await staffEdit(Center)
    else if (activity == "unit") result = await staffEdit(Unit)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }

  } catch (error) {
    console.log({success: false, error})
  }
  res.json({success: true, message: `Staff from department with the ID ${departmentId} has been edited`,result})
}


// delete or remove hod
exports.removeHod = async (req,res,next) => {
  const {departmentId,activity} = req.query;
  let result

  const hodRemove = async (Document) => {
    const resultImage = await Document.findOne({"departmentList.departmentId":departmentId},{_id:0,departmentList:1})
    const resultImageFilter = resultImage.departmentList.filter((dpt)=>{
      return dpt.departmentId == departmentId
    })    
    
    console.log(resultImageFilter)
    if(resultImageFilter[0].hod.image != null){
      // console.log('222222','hshsisi')
      
      
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
    await Document.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set:{"departmentList.$.hod":null}})
    return await Document.findOne({"departmentList.departmentId":departmentId},{"departmentList.staffList.password":0})
    
  }

  try {
    if (activity == "faculty") result = await hodRemove(Faculty)
    else if (activity == "college") result = await hodRemove(College)
    else if (activity == "school") result = await hodRemove(School)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
  } catch (error) {
  console.log({success: false, error})
    
  }
  res.json({success: true, message: `HOD from department with the ID ${departmentId} has been removed`, result})
}

// delete or department program
exports.removeDepartmentProgram = async (req,res,next) => {
  const {departmentId,programId,activity,entityId,target} = req.query;

  const removeProgram = async (Document) => {
    if (activity == 'center' || activity == 'unit'){
      await Document.findOneAndUpdate(
        {"programs.programId":programId},
        {$pull:{"programs": {programId: programId}}},
       
        )
      return await Document.findOne({[target]:entityId},{"staffList.password":0})
    }else{
      await Document.findOneAndUpdate(
        {"departmentList.programs.programId":programId},
        {$pull:{"departmentList.$[e1].programs": {programId: programId}}},
        { 
          arrayFilters: [
            {"e1.departmentId": departmentId},
            { "e2.programId": programId}],
        }
        )
      return await Document.findOne({"departmentList.departmentId":departmentId},{"departmentList.staffList.password":0})
    }
  }

  try {
    let result

    
    if (activity == "faculty") result = await removeProgram(Faculty)
    else if (activity == "college") result = await removeProgram(College)
    else if (activity == "school") result = await removeProgram(School)
    else if (activity == "center") result = await removeProgram(Center)
    else if (activity == "unit") result = await removeProgram(Unit)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
    res.json({success: true, message: `Program with the ID ${programId} has been removed`, result})
    
  } catch (error) {
  console.log({success: false, error})
    
  }
}

// delete or all department program
exports.removeAllDepartmentProgram = async (req,res,next) => {
  const {departmentId,target,activity,entityId} = req.query;

  const removeProgram = async (Document) => {
    if (activity == 'center' || activity == 'unit'){
      await Document.findOneAndUpdate(
        {[target]:entityId},
        {$set:{"programs": []}},
       
        )
      return await Document.findOne({[target]:entityId},{"staffList.password":0})
    }else{
      await Document.findOneAndUpdate(
        {"departmentList.departmentId":departmentId},
        {$set:{"departmentList.$[e1].programs": []}},
        { 
          arrayFilters: [
            {"e1.departmentId": departmentId},
            ],
        }
        )
      return await Document.findOne({"departmentList.departmentId":departmentId},{"departmentList.staffList.password":0})
    }
  }

  try {
    let result

    
    if (activity == "faculty") result = await removeProgram(Faculty)
    else if (activity == "college") result = await removeProgram(College)
    else if (activity == "school") result = await removeProgram(School)
    else if (activity == "center") result = await removeProgram(Center)
    else if (activity == "unit") result = await removeProgram(Unit)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
    res.json({success: true,  result})
    
  } catch (error) {
  console.log({success: false, error})
    
  }
}




// delete or remove staff
exports.removeDepartmentStaff = async (req,res,next) => {
  const {departmentId,staffId,entityId,activity,target} = req.query;
  let result

  const staffRemove = async (Document) => {
    if (activity == 'center' || activity == 'unit'){
      await Document.findOneAndUpdate(
        {[target]:entityId},
        {$pull:{"staffList": {staffId: staffId}}},
       
        )
  
      return await Document.findOne({[target]:entityId})
    }else{
      await Document.findOneAndUpdate(
        {[target]:entityId},
        {$pull:{"departmentList.$[e1].staffList": {staffId: staffId}}},
        { 
          arrayFilters: [
            {"e1.departmentId": departmentId},
            { "e2.staffId": staffId}],
        }
        )
  
      return await Document.findOne({[target]:entityId})
    }
  }

  try {
    if (activity == "faculty") result = await staffRemove(Faculty)
    else if (activity == "college") result = await staffRemove(College)
    else if (activity == "school") result = await staffRemove(School)
    else if (activity == "center") result = await staffRemove(Center)
    else if (activity == "unit") result = await staffRemove(Unit)
    else {
      res.json({success: false, message: "Wrong parameters"});

    } 
    
  } catch (error) {
  console.log({success: false, error})
    
  }
  res.json({success: true, message: `Staff with the ID ${staffId} has been removed`, result})
}


// delete Department
exports.removeDepartment = async (req,res,next) => {
  const {departmentId,activity,facultyId} = req.query;
  try {
    if (activity == "faculty")  await departmentDelete(Faculty,departmentId,facultyId,req,res)
    else if (activity == "college")  await departmentDelete(College,departmentId,facultyId,req,res)
    else if (activity == "school")  await departmentDelete(School,departmentId,facultyId,req,res)
    else {
      res.json({success: false, message: "Wrong parameters"});

    } 
  } catch (error) {
  console.log({success: false, error})
    
  }
}



// About us start here
exports.createAbout = async (req,res,next) => {
 
  singleUpload(req, res, async function(err) {
    let mediaImage
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (req.file) {
      
      if (req.body.activity != "chancellor" && req.body.activity != "proChancellor") req.body.evntId = randomstring.generate(8)
      if (req.file != null && req.file != undefined && req.file != ''){
        mediaImage = await cloudinaryUplouder.upload(req.file.path)
        req.body.image = mediaImage
      }
      const about = await About.find()
      let result
      
      if (about.length == 0){
        await About.collection.insertOne({
          "chancellor" : {},
          "council": [],
          "principalOfficer": [],
          "proChancellor": {}
        })
      }
      const {activity} = req.body
      let data = req.body
      delete data.activity
      // console.log(req.file.path, req.body)
      if(activity == "chancellor"){
    
        result = await About.findOneAndUpdate({},{$set:{[activity]:data}},{new:true})
    
      }else if(activity == "proChancellor"){
        
        result = await About.findOneAndUpdate({},{$set:{[activity]:data}},{new:true})
    
      }else{
        result = await About.findOneAndUpdate({},{$push:{[activity]:data}},{new:true})
    
      }
      result = await About.findOne()
      res.json({success: true, message: 'About created successfullty', result, newlyData:req.body});
    }
  })


}

exports.editAbout = async (req,res,next) => {
  let allEvents;
  const {eventId,data,activity} = req.body;
  
  if(activity == "council"){

    allEvents = await About.findOneAndUpdate({"council.evntId": eventId},{$set: {
      "council.$.name": data.name, 
      "council.$.rank": data.rank, 
      "council.$.detail": data.detail,
      "council.$.facebook": data.facebook,
      "council.$.twitter": data.twitter,
      "council.$.linkedIn": data.linkedIn,
      "council.$.mail": data.mail,

     
    }},{new:true})

  }else if(activity == "principalOfficer"){
    allEvents = await About.findOneAndUpdate({"principalOfficer.evntId": eventId},{$set: {
      "principalOfficer.$.name": data.name,
      "principalOfficer.$.rank": data.rank,
      "principalOfficer.$.detail": data.detail,
      "principalOfficer.$.facebook": data.facebook,
      "principalOfficer.$.twitter": data.twitter,
      "principalOfficer.$.linkedIn": data.linkedIn,
      "principalOfficer.$.mail": data.mail,


    }},{new:true})
  }else if(activity == "chancellor"){
    allEvents = await About.updateOne({},{$set: {
      "chancellor.name": data.name,
      "chancellor.rank": data.rank,
      "chancellor.detail": data.detail,
      "chancellor.facebook": data.facebook,
      "chancellor.twitter": data.twitter,
      "chancellor.linkedIn": data.linkedIn,
      "chancellor.mail": data.mail,


    }},{new:true})

  }else if(activity == "proChancellor"){
    allEvents = await About.findOneAndUpdate({},{$set: {
      "proChancellor.name": data.name,
      "proChancellor.rank": data.rank,
      "proChancellor.detail": data.detail,
      "proChancellor.facebook": data.facebook,
      "proChancellor.twitter": data.twitter,
      "proChancellor.linkedIn": data.linkedIn,
      "proChancellor.mail": data.mail,


    }},{new:true})
  }

  const result = await About.find()
  res.json({success:true, result})
}

exports.addAboutImages = async (req,res, next) => {
  const {eventId,activity} = req.query
  // console.log(eventId,activity)
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
        if(activity == "chancellor"){

          const result = await About.findOne()
           
          if(result.chancellor.image != undefined){
          // console.log('222222','hshsisi')
  
            
            const imageName = result.chancellor.image.split('/').splice(7)
            // console.log('-----------------',imageName)
  
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
  
            allResults = await About.findOneAndUpdate({},{$set: {"chancellor.image": result.secure_url}},{new:true})
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
       
         
        
        }else if(activity == "proChancellor"){

          const result = await About.findOne()
           
          if(result.proChancellor.image != undefined){
          // console.log('222222','hshsisi')
  
            
            const imageName = result.proChancellor.image.split('/').splice(7)
            // console.log('-----------------',imageName)
  
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
  
            allResults = await About.findOneAndUpdate({},{$set: {"proChancellor.image": result.secure_url}},{new:true})
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
        
        }else if(activity == "principalOfficer"){
          const result = await About.findOne({},{_id: 0,[activity]: 1})
          
          const resultFilter = result[activity].filter((evnt)=>{
            return evnt.evntId == eventId
          })
          // console.log(resultFilter)
          if(resultFilter[0].image != undefined){
          // console.log('222222','hshsisi')
  
            
            const imageName = resultFilter[0].image.split('/').splice(7)
            // console.log('-----------------',imageName)
  
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
  
            allResults = await About.findOneAndUpdate({"principalOfficer.evntId": eventId},{$set: {"principalOfficer.$.image": result.secure_url}},{new:true})
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
       
  
  
        }else if(activity == "council"){
          const result = await About.findOne({},{_id: 0,[activity]: 1})
          
          const resultFilter = result[activity].filter((evnt)=>{
            return evnt.evntId == eventId
          })
          // console.log(resultFilter)
          if(resultFilter[0].image != undefined){
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
  
            allResults = await About.findOneAndUpdate({"council.evntId": eventId},{$set: {"principalOfficer.$.image": result.secure_url}},{new:true})
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
       
  
  
        }else{
          res.json({success:false, message: "Wrong parameters"})
        }
      }catch (e){
        console.log(e)
      }
  
    }  
        
  
  })
}

// delete or about leadership content
exports.removeAboutLeadershipContent = async (req,res,next) => {
  const {activity,eventId} = req.query;
  const result = await About.findOne({},{_id: 0,[activity]: 1})
        
  const resultFilter = result[activity].filter((evnt)=>{
    return evnt.evntId == eventId
  })

  if(activity == "principalOfficer"){
    const imageName = resultFilter[0].image.split('/').splice(7)
    // console.log('-----------------',imageName)

      cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
    {
      invalidate: true,
        resource_type: "raw"
    }, 
    function(error,result) {
      console.log('33333333',result, error)
    });  


  await About.findOneAndUpdate({evntId:eventId},{$pull:{[activity]:{evntId: eventId}}})
  res.json({success: true, message: `Event with the id ${eventId} has been removed`})

  }else if(activity == "council"){
    const imageName = resultFilter[0].image.split('/').splice(7)
    // console.log('-----------------',imageName)

      cloudinary.v2.api.delete_resources_by_prefix(imageName[0], 
    {
      invalidate: true,
        resource_type: "raw"
    }, 
    function(error,result) {
      console.log('33333333',result, error)
    }); 
    
    await About.findOneAndUpdate({evntId:eventId},{$pull:{[activity]:{evntId: eventId}}})
    const result = await About.find()
  res.json({success: true, message: `Event with the id ${eventId} has been removed`, result})
  }else{
  res.json({success: false, message: `Wrong parameters`})

  }

  
}

exports.getAboutLeadership = async (req,res,next) => {
  try {
    
    const result = await About.find()
    res.json({success: true, result})
  } catch (error) {
    console.log(e)
  }
}

exports.getSinglePrincipalOfficer = async (req,res,next) =>{
  const { principalId } = req.query

  try {
    const result = await About.aggregate([
      {$match: {}},
      {$project: {principalOfficer: 1, _id:0}},
      {$unwind: "$principalOfficer"},
      {$match: {"principalOfficer.evntId": principalId}},

    ])

    res.json({success: true, result:result[0]})

  } catch (error) {
    console.log(error)
  }
}