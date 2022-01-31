const express = require('express')
const app = express()

app.set('trust proxy', 1);
var fs = require("fs");
var multer = require('multer')
var multerS3 = require('multer-s3')
var path = require('path');
var http = require('http')
var https = require('https')
var request = require('request');
var bodyParser = require('body-parser');
require('dotenv').config()
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
var AWS = require("aws-sdk");


var albumBucketName = process.env.REACT_APP_S3_BUCKET;
var cors = require('cors')

app.get("/", express.static(path.join(__dirname, "./public")));

const upload = multer({
  dest: "/Users/djbrenne/PycharmProjects/frontendtemplates/s3crud/myapp/public/images"
});

const handleError = (err, res) => {
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!" + err);
};

app.use(cors())

AWS.config.region = "us-east-2"; // Region


AWS.config.credentials

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName },
});

var bucketParams = { Bucket: albumBucketName };
s3.getBucketAcl(bucketParams, function (err, data) {
  if (err) {
    console.log("Error", err);
  } else if (data) {
    console.log("Success", data.Grants);
  }
});


app.use(bodyParser.json());

app.get('/api/viewalbum/:id?', function(req, res, next) {

    var albumName = req.params.id
    var albumPhotosKey = encodeURIComponent(albumName) + "/";

    s3.listObjects({ Prefix: albumPhotosKey }, (err, data) => {
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }

      var href = "https://s3.us-east-2.amazonaws.com/";
      var bucketUrl = href + albumBucketName + "/";


      var myphotos = [];

      var myphotosarray = data.Contents;

      if (JSON.stringify(data.Contents).match(/\.(gif|jpe?g|png)/i)) {
          var photos = myphotosarray.map((photo) => {
              var photoKey = photo.Key;
              var photoUrl = bucketUrl + encodeURIComponent(photoKey);
              var myadd = bucketUrl + encodeURIComponent(photoKey);
              myphotos.push(myadd);
          });

          res.send({data: myphotos})
      } else {
          res.send({data: null})
      }
    });
  })


app.get('/api/listalbums', function(req, res, next) {
    s3.listObjects({ Delimiter: "/" }, (err, data) => {
      if (err) {
        res.send("There was an error listing your albums: " + err.message);
      } else {
        var myalbums = [];

        var albums = data.CommonPrefixes.map((commonPrefix) => {
          var prefix = commonPrefix.Prefix;
          var albumName = decodeURIComponent(prefix.replace("/", ""));

          myalbums.push(albumName);
        });
            res.send({ message: myalbums })
      }
    });
  })

app.post('/api/createalbum/:album?', function(req, res, next) {
    console.log("reached createalbum " + req.params.album)
    var album = req.params.album

    if (!album) {
      res.send(
        "Album names must contain at least one non-space character."
      );
    } else {
        if (album.indexOf("/") !== -1) {
            res.send("Album names cannot contain slashes.");
        }
        var albumKey = encodeURIComponent(album) + "/";

        s3.headObject({Key: albumKey}, (err, data) => {
            if (!err) {
                res.send("Album already exists.");
            }
            if (err.code !== "NotFound") {
                res.send("There was an error creating your album: " + err.message);
            }

            s3.putObject({Key: albumKey}, (err, data) => {
                if (err) {
                    res.send(
                        "There was an error creating your album: " + err.message
                    );
                }

               res.send("Successfully created album.");
            });
        });
    }
  })


app.post('/api/deletealbum/:id?', function(req, res, next) {
    console.log("delete album was called " + req.params.id);
    var albumKey = encodeURIComponent(req.params.id) + "/";

    s3.listObjects({ Prefix: albumKey }, (err, data) => {
      if (err) {
        console.log("There was an error deleting your album: ", err.message);
      }
      var objects = data.Contents.map((object) => {
        return { Key: object.Key };
      });
      s3.deleteObjects(
        {
          Delete: { Objects: objects, Quiet: true },
        },
        (err, data) => {
          if (err) {
            res.send(
              "There was an error deleting your album: ",
              err.message
            );
          }
          res.send("Successfully deleted album.");
        }
      );
    });
  })


app.post('/api/addphoto', function(req, res, next) {
    console.log("reached add photo");

    var albumPhotosKey = encodeURIComponent(albumName) + "//";

    var photoKey = albumPhotosKey + fileName;
    console.log("uploading photo key " + photoKey)
    s3.upload(
      {
        Key: photoKey,
        Body: file,
        ACL: "public-read",
      },
      (err, data) => {
        if (err) {
          return alert(
            "There was an error uploading your photo: ",
            err.message
          );
        }
        alert("Successfully uploaded photo.");
        this.viewAlbum(albumName);
      }
    );
  })


var tarupload = multer({
    storage: multerS3({
        s3: s3,
        bucket: albumBucketName,
        key: function (req, file, cb) {
            console.log(req.body);
            cb(null, req.body.myfile); //use Date.now() for unique file keys
        }
    })
});




app.post('/tarupload2', function(req,res,next) {
    console.log("tarupload2 ")
            tarupload.array('file',1)(req, res, (error) => {
                console.log('Upload successful.')
                        if (error instanceof multer.MulterError)
            return res.status(400).json({
                message: 'Upload unsuccessful',
                errorMessage: error.message,
                errorCode: error.code
            })

        if (error)
            return res.status(500).json({
                message: 'Error occured',
                errorMessage: error.message
            })
                next()
    })
    res.send("done")
}
)


app.post('/tarupload', tarupload.array('file',1), function (req, res, next) {

    console.log(req.body);
    res.send("Uploaded!");
});


app.post(
  "/api/upload",
  upload.any("file" /* name attribute of <file> element in your form */),
  (req, res) => {
      console.log("reached post api upload")
      console.log("request has objects " + req.file)
    if (req.file){
        const tempPath = req.file.path;
        console.log("req file path " + req.file.path)
        console.log("req file " + JSON.stringify(req.file))
        const targetPath = path.join(__dirname, "./uploads/" + req.file.originalname);


    if (path.extname(req.file.originalname).toLowerCase() === ".jpeg" || "jpg") {

            var albumPhotosKey = encodeURIComponent(albumBucketName) + "//";
          var photoKey = albumPhotosKey + req.file.originalname;
          console.log("photokey " + photoKey)
           multer({
              storage: multerS3({
                s3: s3,
                bucket: albumBucketName,
                  acl: 'public-read',
                metadata: function (req, file, cb) {
                  // cb(null, {fieldName: req.file.originalname});
                  cb(null, Object.assign({}, req.body));
                },
                key: function (req, file, cb) {
                  cb(null, Date.now().toString())
                }
              })
            })
    } else {
      fs.unlink(tempPath, err => {
        if (err) return handleError(err, res);

        res
          .status(403)
          .contentType("text/plain")
          .end("Only .png files are allowed!");
      });
    }
  } else {
      res.send("no file received")
}}
);

app.post('/api/addcompressed', function(req, res, next) {
    console.log("reached add photo");
    if (!files.length) {
      return alert("Please choose a file to upload first.");
    }
    var file = files;
    var fileName = "orange.jpeg";
    var albumPhotosKey = encodeURIComponent(albumName) + "//";

    var photoKey = albumPhotosKey + fileName;
    s3.upload(
      {
        Key: photoKey,
        Body: file,
        ACL: "public-read",
      },
      (err, data) => {
        if (err) {
          return alert(
            "There was an error uploading your photo: ",
            err.message
          );
        }
        alert("Successfully uploaded photo.");
        this.viewAlbum(albumName);
      }
    );
  })



app.get('/api/deletephoto/:photokey(*)', function(req, res, next) {

    var photobucket = req.params.photobucket
    var photokey = req.params.photokey
    console.log("req.params.photokey " + photokey);

    var photokeycombo = albumBucketName + "/" + photokey

    var dparams = {  Bucket: albumBucketName, Key: photokey};

        s3.headObject({Key: photokeycombo}, (err, data) => {
            if (!err) {
                console.log("Found file.");
            }
            if (err.code !== "NotFound") {
                console.log("There was an error creating your album: " + err.message);
            }
        })

    s3.deleteObject(dparams, (err, data) => {
      if (err) {
        console.log("There was an error deleting your photo: ", err);
      }
      if (data) {
          console.log("delete photo data "+ JSON.stringify(data))
      }
    });
  })


app.listen(8000, () => console.log('Server running on port 8000 '))


module.exports = app
