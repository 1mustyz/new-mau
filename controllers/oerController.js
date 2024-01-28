const Oer = require("../models/oer");
const randomstring = require("randomstring");
const fs = require("fs");
const {
  singleUpload,
  singleFileUpload,
  singleAllMediaUpload,
} = require("../middlewares/filesMiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinarySetup = require("../middlewares/cluadinarySetup");
const Library = require("../models/library");

// cloudinary configuration for saving files
cloudinarySetup.setup();

// add librarian
exports.createLibrarian = async (req, res) => {
  try {
    await Library.create(req.body);
    const result = await Library.find();

    res.json({
      success: true,
      message: "Librarian created successfullty",
      result,
    });
  } catch (e) {
    console.log(e);
  }
};

// Add oer
exports.addOer = async (req, res) => {
  const id = req.query.id;
  const data = req.body;
  Library.findOneAndUpdate(
    { "oers._id": undefined },
    {
      $set: {
        "oers.$.name": data.name,
        "oers.$.oerList": data.list,
      },
    },
    { new: true, upsert: true }
  )
    .then((updatedLibrary) => {
      if (!updatedLibrary) {
        console.log("Library not found or oer not updated.");
        return;
      }
      res.json(updatedLibrary);
    })
    .catch((error) => {
      console.error("Error updating library:", error);
    });
};
// edit oer
exports.editOer = async (req, res, next) => {
  const { oerId, data } = req.body;
  try {
    await Oer.findOneAndUpdate({ oerId }, data, { new: true });
    const result = await Oer.find();

    res.json({ success: true, editedEvent: data, result });
  } catch (e) {
    console.log(e);
  }
};

// exports.getSingleMainEvents = async (req,res,next) => {
//   const {oerId} = req.query

//   try{
//     const singleMainEvent = await Oer.aggregate([
//       {$match:{"mainEvents.oerId": eventId}},
//       {$project: {mainEvents:1,_id:0}},
//       {$unwind: "$mainEvents"},
//       {$match:{"mainEvents.oerId": eventId}},
//     ])
//     res.json({success:true, result: singleMainEvent[0].mainEvents})
//   }catch(e){
//     console.log(e)
//   }

// }

// delete or remove oer
exports.removeOer = async (req, res, next) => {
  const { oerId } = req.query;
  const result = await Oer.findOne({ oerId }, { _id: 0, oerLink: 1 });

  console.log(result);
  const imageName = result.oerLink.split("/").splice(7);
  console.log("-----------------", imageName);

  cloudinary.v2.api.delete_resources_by_prefix(
    imageName[0],
    {
      invalidate: true,
      resource_type: "raw",
    },
    function (error, result) {
      console.log("33333333", result, error);
    }
  );

  await Oer.findOneAndDelete({ oerId });
  res.json({
    success: true,
    message: `Oer with the id ${oerId} has been removed`,
  });
};

exports.getOer = async (req, res, next) => {
  try {
    const result = await Oer.find({});
    result.length > 0
      ? res.json({ success: true, message: result })
      : res.json({ success: false, message: result });
  } catch (error) {
    res.json({ success: false, error });
  }
};

// Add oer file
exports.addOerFile = async (req, res, next) => {
  const { oerId } = req.query;
  let allResults;
  try {
    fs.rmSync("./public/images", { recursive: true });
  } catch (err) {
    console.error(err);
  }

  const dir = "./public/images";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }

  singleFileUpload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.json(err.message);
    } else if (err) {
      return res.json(err);
    } else if (!req.file) {
      return res.json({
        file: req.file,
        msg: "Please select a file to upload",
      });
    }
    if (req.file) {
      if (req.file.size > 10000000)
        return res.json({
          success: false,
          message: "File size should not be greater 10mb",
        });
      // console.log('1111111',req.file)

      try {
        const result = await Oer.findOne({ oerId }, { _id: 0, oerLink: 1 });

        console.log(result);

        if (result.oerLink != undefined || result.oerLink != null) {
          // console.log('222222','hshsisi')

          const imageName = result.oerLink.split("/").splice(7);
          console.log("-----------------", imageName);

          cloudinary.v2.api.delete_resources_by_prefix(
            imageName[0],
            {
              invalidate: true,
              resource_type: "raw",
            },
            function (error, result) {
              // console.log('33333333',result, error)
            }
          );
        }

        cloudinary.v2.uploader.upload(
          req.file.path,
          { resource_type: "raw" },
          async function (error, result) {
            await Oer.findOneAndUpdate(
              { oerId },
              { $set: { oerLink: result.secure_url } },
              { new: true }
            );
            allResults = await Oer.find({});

            res.json({ success: true, message: allResults });
          }
        );
      } catch (error) {
        console.log(error);
      }
    }
  });
};
