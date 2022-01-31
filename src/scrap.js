import React from "react";

          <h2>Upload to api/upload</h2>
          <form onSubmit={(e) => uploadmy(e)}>
            <div>Please select a picture to upload</div>
            <input
              type="file"
              id="formuploadtry"
              name="file"
              accept="image/*"
              className="uploadclass"
              multiple
            />
            <input type="submit" accept="image/*" value="Submit" />
          </form>
<br />
          <h3>multipart form tarupload</h3>
          <form
            action="http://127.0.0.1:8000/tarupload"
            method="post"
            encType="multipart/form-data"
          >
            <input name="file" type="file" />
            <input type={"submit"} />
          </form>
          <br />
          <h3>multipart form tarupload2</h3>
          <form
            action="http://127.0.0.1:8000/tarupload2"
            method="post"
            encType="multipart/form-data"
          >
            <input name="file" type="file" />
            <input type={"submit"} />
          </form>



  const handleFileSelected = (e) => {
    const files = Array.from(e.target.files);
    console.log("files:", files[0].name);
    uploadmy(files[0]);
  };


    const uploadmy = (e) => {
    e.preventDefault();
    console.log("your album key " + albumPhotosKey);
    // const files = Array.from(e.target.files);
    const files = document.getElementById("formuploadtry").files[0];
    // console.log("files:", files[0].name);
    // e.preventDefault();
    // var imagefile = document.querySelector('#file');
    // const zfile = e.currentTarget.files[0];
    var formData = new FormData();
    if (files) {
      try {
        formData.append("image", files);
        axios
          .post("http://127.0.0.1:8000/api/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then(function (response) {
            // handle success
            console.log("uploadmy response" + JSON.stringify(response));
            setlistAlbums(response);
          })
          .catch(function (error) {
            // handle error
            console.log("uploadmy error" + error);
          })
          .then(function (data) {
            console.log("uploadmy successful then");
          });
      } catch (err) {
        console.log("no file for upload");
      }
    } else {
      console.log("no files for api upload");
    }
  };
