const Staff = require('../models/staff')
const passport = require('passport');
const Faculty = require('../models/faculty')
const College = require('../models/college')
const School = require('../models/school')
const Center = require('../models/center')
const multer = require('multer');
const {singleUpload,singleFileUpload} = require('../middlewares/filesMiddleware');
const { uuid } = require('uuidv4');
const jwt =require('jsonwebtoken');
const csv = require('csv-parser')
const fs = require('fs')
const msToTime = require('../middlewares/timeMiddleware')
const math = require('../middlewares/math.middleware')
const randomstring = require("randomstring");
const cloudinary = require('cloudinary');
const mailgun = require("mailgun-js");
const HomePage = require('../models/homePage');
const DOMAIN = "sandbox09949278db4c4a108c6c1d3d1fefe2ff.mailgun.org";
const mg = mailgun({apiKey: "9bd20544d943a291e8833abd9e0c9908-76f111c4-8a189b96", domain: DOMAIN});
const bcrypt = require('bcrypt');
const broc = require('./brochure')
const cloudinarySetup = require('../middlewares/cluadinarySetup')


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
  const {username} = req.query;
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

      if(activity == 'center'){

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

    let facultyDepartmentList = await departmentCount(Faculty)
    let collegeDepartmentList = await departmentCount(College)
    let schoolDepartmentList = await departmentCount(School)

    console.log(collegeDepartmentList,schoolDepartmentList)


    const result = await {facultyCount:faculty[0],collegeCount:college[0],schoolCount:school[0],centerCount:center[0]}
    const departmentList = await {
      faculty:facultyDepartmentList.length > 0 ? facultyDepartmentList[0]['NumberOfCount'] : facultyDepartmentList = 0, 
      college:collegeDepartmentList.length > 0 ? collegeDepartmentList[0]['NumberOfCount']  : collegeDepartmentList = 0, 
      school:schoolDepartmentList.length > 0 ? schoolDepartmentList[0]['NumberOfCount']  : schoolDepartmentList = 0}
    // console.log()

    let facultyProgramList = await programCount(Faculty)
    let collegeProgramList = await programCount(College)
    let schoolProgramList = await programCount(School)
    let centerProgramList = await programCount(Center,'center')

    const programList = await {
      faculty:facultyProgramList.length > 0 ? facultyProgramList[0]['NumberOfCount'] : facultyProgramList = 0, 
      college:collegeProgramList.length > 0 ? collegeProgramList[0]['NumberOfCount']  : collegeProgramList = 0,
      school:schoolProgramList.length > 0 ? schoolProgramList[0]['NumberOfCount']  : schoolProgramList = 0,
      program: centerProgramList.length > 0 ? centerProgramList[0]['NumberOfCount'] : centerProgramList = 0
    }

    res.json({success:true, result:{...result,departmentList,programList}})
    
  } catch (error) {
    console.log(error)
  }
}

// Add event pic
exports.addAnImageToEvent = async (req,res, next) => {
  const {eventName,eventId,activity,facultyId,departmentId} = req.query
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
       
  
  
        }else if(activity == "faculty"){
          const result = await Faculty.findOne({facultyId},{_id: 0,image: 1})
          
         
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
            // console.log('444444',result, error); 
  
              await Faculty.findOneAndUpdate({facultyId},{$set: {"image": result.secure_url}},{new:true})
              const allResults = await Faculty.find({},{dean:0,departmentList:0})
           
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
       
  
  
        }else if(activity == "dean"){
          const result = await Faculty.findOne({facultyId},{_id: 0,dean: 1})
          
         
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
  
              await Faculty.findOneAndUpdate({facultyId},{$set: {"dean.image": result.secure_url}},{new:true})
              const allResults = await Faculty.find({facultyId})
           
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
  
        }else if(activity == "department"){
          const result = await Faculty.findOne({"departmentList.departmentId":departmentId},{_id: 0,departmentList:1})
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
  
              await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set: {"departmentList.$.image": result.secure_url}},{new:true})
              const allResults = await Faculty.find({"departmentList.departmentId":departmentId})
           
            
            res.json({success: true,
              message: allResults,
                        },
            
            );
          });
  
        }else if(activity == "hod"){
          const result = await Faculty.findOne({"departmentList.departmentId":departmentId},{_id: 0,departmentList:1})
          resultFilter = result.departmentList.filter((dpt)=>{
            return dpt.departmentId == departmentId
          })
          
          console.log(resultFilter[0].hod.image)
          if(resultFilter[0].hod.image != null){
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
  
              await Faculty.findOneAndUpdate({"departmentList.departmentId":departmentId},{$set: {"departmentList.$.hod.image": result.secure_url}},{new:true})
              const allResults = await Faculty.find({"departmentList.departmentId":departmentId})
           
            
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

    allEvents = await HomePage.findOneAndUpdate({"mainEvents.evntId": eventId},{$set: {"mainEvents.$.header": evnt.header, "mainEvents.$.description": evnt.description, "mainEvents.$.description": evnt.subHeader}},{new:true})
  }else if(eventName == "newsEvents"){
    allEvents = await HomePage.findOneAndUpdate({"newsEvents.evntId": eventId},{$set: {"newsEvents.$.header": evnt.header, "newsEvents.$.description": evnt.description, "newsEvents.$.description": evnt.subHeader}},{new:true})
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
  
  if (status === 'center'){
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

      if (status == 'center') insertedResult = await Document.find({},{dean:0, programs:0, staffList:0})
      else insertedResult = await Document.find({},{dean:0, departmentList:0})
      
      const faculty = await Faculty.find({},{_id:0, facultyName:1, facultyId:1})
      const school = await School.find({},{_id:0, schoolName:1, schoolId:1})
      const college = await College.find({},{_id:0, collegeName:1, collegeId:1})
      const center = await Center.find({},{_id:0,centerName:1, centerId:1})

      result = {faculties:faculty, schools:school, colleges:college, centers:center}

      res.json({success: true, message, result, insertedResult});

    }
    if (status === 'faculty') inserter(Faculty,'Faculty created successfullty')
    else if (status === 'college') inserter(College,'College created successfully')
    else if (status === 'school') inserter(School, 'School created successfully')
    else if (status === 'center') inserter(Center, 'Center created successfully')
    else {
      res.json({success: false, message: 'Incorrect status'});

    }
    
  } catch (error) {
  console.log(error);
    
  }
}

// functiion
const getAllFacultiesOrSchoolOrCollege = async (Document, entityName, entityId ) => {
  try {
   return await Document.find({},{[entityName]:1,[entityId]:1,_id:0});
    
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


    const result = {
      faculty,
      school,
      college,
      center
    }
    res.json({success: false, message: result,})



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


    
    let resulty
    
    if (result){
      if (activity == "center"){
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
           "facultyId":result.facultyId,
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
          "facultyId":result.facultyId,
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

// get all department
exports.getAllDepartment = async (req,res, next) => {

  const allDepartment = async(Document) => {

    let result = await Document.find({},{"departmentList.staffList.password":0, _id:0});
  
    let resulty = []
    result.map((dpt)=>{
      dpt.departmentList.map((innerDpt)=>{
  
      resulty.push(innerDpt) 
      })
    })
    return resulty
  }
  try {
    const facultyDepartment = await allDepartment(Faculty);
    const collegeDepartment = await allDepartment(College);
    const schoolDepartment = await allDepartment(School);

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

      if(activity == 'center'){
        //delete staff image
        resultImage.staffList.map((stf)=>{
  
          if (stf.image != null){
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
          
    
        })    
        //deleting programs brochure
        if (resultImage.programs.length != 0){
          resultImage.programs.map((prm) => {
            console.log(prm)
            if(prm.brochure != undefined){
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
        
      }else{

        resultImage.departmentList.map((dpt)=>{
          console.log(dpt)
    
          if (dpt.programs.length != 0){
              dpt.programs.map((prm) => {
              console.log(prm)
              if(prm.brochure != undefined){
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

      // delete faculty image from server
    if(resultImage.image != null){
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

    // delete faculty image from server
    if(resultImage.dean != null){
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
        result = activity == "center" ?  await Document.find({},{dean:0,programs:0,staffList:0}) : await Document.find({},{dean:0,departmentList:0})
        res.json({success: true, message: `Faculty with the ID ${entityId} has been removed`, result})
  
      })
    }

    if (activity == "faculty") await doDelete(Faculty);
    else if (activity == "college") await doDelete(College);
    else if (activity == "school") await doDelete(School);
    else if (activity == "center") await doDelete(Center);
        
    
    
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
    return activity == 'center' 
    ? await Document.findOne({[target]:entityId},{_id:0, "staffList.password":0})
    : await Document.findOne({[target]:entityId},{_id:0, "departmentList.staffList.password":0})

  }

  try {
    if (activity == "faculty") result = await createDean(Faculty);
    else if (activity == "college") result = await createDean(College);
    else if (activity == "school") result = await createDean(School);
    else if (activity == "center") result = await createDean(Center);
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
    else {
      res.json({success:false, message:'Wrong activity'})
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
        "departmentList.$.vission":department.vission
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

    if(activity == 'center'){

      await Document.findOneAndUpdate({centerId:entityId},{$push:{"staffList":staff}},{new:true})
      return await Document.findOne({centerId: entityId},{_id:0,"staffList.password":0});
      
    }else{
      await Document.findOneAndUpdate({"departmentList.departmentId":entityId},{$push:{"departmentList.$.staffList":staff}},{new:true})
      let result = await Document.findOne({"departmentList.departmentId": entityId},{"departmentList.staffList.password":0});
      return result.departmentList.filter((dpt)=>{
        return dpt.departmentId == departmentId
      })
    }
    

  }

  try {

    if (activity == "faculty") result = await createAcademicStaff(Faculty)
    else if (activity == "college") result = await createAcademicStaff(College)
    else if (activity == "school") result = await createAcademicStaff(School)
    else if (activity == "center") result = await createAcademicStaff(Center)
    else {
      res.json({success: false, message: "Wrong parameters"});

    }

  } catch (error) {
    console.log(error)
    
  }
  res.json({success: true, message: 'Staff created successfullty', result});
}

// add department programs
exports.addDepartmentProgram = async (req,res,next) => {
  const {activity,entityId} = req.query
  const {program} = req.body
  program.programId = randomstring.generate(8)

  const addProgam = async (Document) => {
    if(activity == 'center'){

     return await Document.findOneAndUpdate({centerId:entityId},{$push:{"programs":program}},{new:true})
      
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
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
  } catch (error) {
  console.log(error);
    
  }
  res.json({success: true, message: 'Program created successfullty', result});
}

// add brochure
exports.addProgramBrochure = async (req,res,next) => {
  const {programId,departmentId,activity} = req.query

  try {
    if (activity == "faculty")  await broc.addBrochure(Faculty,activity,programId,departmentId,req,res)
    else if (activity == "college")  await broc.addBrochure(College,activity,programId,departmentId,req,res)
    else if (activity == "school")  await broc.addBrochure(School,activity,programId,departmentId,req,res)
    else if (activity == "center")  await broc.addBrochure(Center,activity,programId,departmentId,req,res)
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
        "departmentList.$.hod.qualification":hod.qualification,
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
    if (activity == 'center'){
      await Document.findOneAndUpdate(
        {"programs.programId":programId},
        {$set:{
          "programs.$[e2].name":program.name,
          "programs.$[e2].mission":program.mission,
          "programs.$[e2].vission":program.vission,
          "programs.$[e2].admissionRequirement":program.admissionRequirement,
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
          "departmentList.$[e1].programs.$[e2].mission":program.mission,
          "departmentList.$[e1].programs.$[e2].admissionRequirement":program.admissionRequirement,
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
   if (activity == 'center'){
    await Document.findOneAndUpdate(
      {"staffList.staffId":staffId},
      {$set:{
        "staffList.$[e2].name":staff.name,
        "staffList.$[e2].qualification":staff.qualification
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
        "departmentList.$[e1].staffList.$[e2].qualification":staff.qualification
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
  const {departmentId,programId,activity,entityId} = req.query;

  const removeProgram = async (Document) => {
    if (activity == 'center'){
      await Document.findOneAndUpdate(
        {"programs.programId":programId},
        {$pull:{"programs": {programId: programId}}},
       
        )
      return await Document.findOne({centerId:entityId},{"staffList.password":0})
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
    else {
      res.json({success: false, message: "Wrong parameters"});

    }
    res.json({success: true, message: `Program with the ID ${programId} has been removed`, result})
    
  } catch (error) {
  console.log({success: false, error})
    
  }
}

// delete or remove staff
exports.removeDepartmentStaff = async (req,res,next) => {
  const {departmentId,staffId,entityId,activity,target} = req.query;
  let result

  const staffRemove = async (Document) => {
    if (activity == 'center'){
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
  const {departmentId,facultyId} = req.query;
  let result
  try {
    const resultImage = await Faculty.findOne({"departmentList.departmentId":departmentId},{_id:0,departmentList:1})
    const bigPromise = () => {
      const resultImageFilter = resultImage.departmentList.filter((dpt)=>{
        return dpt.departmentId == departmentId
      })    
      
      console.log(resultImageFilter)
  
      // delete all programs brochure
      const dptPrograms = resultImageFilter[0].programs
      dptPrograms.map((prm) => {
        console.log(prm)
        if(prm.brochure != undefined){
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
      // delete hod image from server
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
      await Faculty.findOneAndUpdate({"facultyId":facultyId},{$pull:{"departmentList":{"departmentId":departmentId}}})
      result = await Faculty.findOne({"facultyId":facultyId})
      res.json({success: true, message: `Department with the ID ${departmentId} has been removed`, result})
    })
    
  } catch (error) {
  console.log({success: false, error})
    
  }
}

