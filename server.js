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

app.use(cors())

AWS.config.region = process.env.REACT_APP_AWS_REGION; // Region
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

      if (JSON.stringify(data.Contents).match(/\.(gif|jpe?g|png|svg)/i)) {
          myphotosarray.map((photo) => {
              var photoKey = photo.Key;
              var myadd = bucketUrl + encodeURIComponent(photoKey);
              if (myadd.match(/\.(gif|jpe?g|png|svg)/i)) {
                  myphotos.push(myadd);
              }
          });
            console.log("sending myphotos " + JSON.stringify(myphotos))
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



app.post('/tarupload', tarupload.array('file',1), function (req, res, next) {

    console.log(req.body);
    res.send("Uploaded!");
});



app.get('/api/deletephoto/:photokey(*)', function(req, res, next) {

    var photokey = req.params.photokey
    console.log("req.params.photokey " + photokey);

    var photokeycombo = albumBucketName + "/" + photokey

    var dparams = {  Bucket: albumBucketName, Key: photokey};

        s3.headObject({Key: photokeycombo}, (err, data) => {
            if (!err) {
                console.log("Found file.");
            }
            if (err.code !== "NotFound") {
                console.log("There was an error deleting your photo: " + err.message);
            }
        })

    s3.deleteObject(dparams, (err, data) => {
      if (err) {
        console.log("There was an error deleting your photo: ", err);
        res.send("There was an error deleting your photo")
      }
      if (data) {
          console.log("delete photo data "+ JSON.stringify(data))
          res.send("successfully deleted photo")
      }
    });
  })


app.listen(8000, () => console.log('Server running on port 8000 '))


module.exports = app
