import React, { Component, useState, useEffect } from "react";
import "./App.css";
import toastr from "toastr";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import { Navbar, Nav, NavDropdown, Form, FormControl } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
const axios = require("axios");

function App() {
  const [albumName, setalbumName] = useState("");
  const [photos, setPhotos] = useState([]);
  const [mylistalbums, setlistAlbums] = useState();

  const handleChanged = async (e) => {
    e.preventDefault();

    if (e.target.files && albumName) {
      const formData = new FormData();
      const newfilename = albumName + "/" + (await e.target.files[0].name);

      formData.set("myfile", newfilename);
      formData.append("file", e.target.files[0], newfilename.toString());

      const requestOptions = {
        method: "POST",
        // headers: { 'Content-Type': 'application/json' },
        body: formData,
      };
      fetch("http://127.0.0.1:8000/tarupload", requestOptions)
        .then((response) => {
          toastr.info("success");
          viewAlbum(albumName);
          document.getElementById('addfileinput').value= ""
        })
        .catch((error) => console.log("Form submit error", error));
    }
  };

  function viewAlbum(albumName) {
    setalbumName(albumName);

    axios
      .get("http://127.0.0.1:8000/api/viewalbum/" + albumName)
      .then(function (response) {
        var mydata = response.data.data;
        if (mydata) {
          setPhotos(mydata);
        } else {
          setPhotos("");
        }
      })
      .catch(function (error) {
        console.log(error);
      })

  }

  function listAlbums() {
    axios
      .get("http://127.0.0.1:8000/api/listalbums")
      .then(function (response) {
        setlistAlbums(response);
      })
      .catch(function (error) {
        console.log("error" + error);
      })

  }

  const createalbum = (e) => {
    e.preventDefault();
    var mynewalbumname = document.getElementById("createalbumid").value;
    console.log(
      "createalbum " + document.getElementById("createalbumid").value
    );
    if (mynewalbumname) {
      axios
        .post("http://localhost:8000/api/createalbum/" + mynewalbumname)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        })
        .then(function (data) {
          setTimeout(() => {
            listAlbums();
          }, 2000);
          document.getElementById("createalbumid").value = "";
          toastr.info("Created New Album")
        });
    }
  };

  function deleteAlbum(albumName) {
    if (
      window.confirm(
        "Are you sure you want to delete this album?\nEither OK or Cancel."
      ) === true
    ) {
      axios
        .post("http://localhost:8000/api/deletealbum/" + albumName)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        })
        .then(function (data) {
          toastr.info("Successfully deleted album.");
          listAlbums(albumName);
        });
    } else {
      console.log("Closed Delete Album");
    }
  }

  function deletePhoto(photoKey) {
    if (
      window.confirm(
        "Are you sure you want to delete this picture?\nEither OK or Cancel."
      ) === true
    ) {
      var photokey3 = photoKey.replace(/%2F/gi, "/");

      fetch(`http://127.0.0.1:8000/api/deletephoto/` + photokey3)
        .then((response) => {
          toastr.info("Successfully deleted");
          setTimeout(() => {
            viewAlbum(albumName);
          }, 2000);
        })
        .catch((error) => console.log("Delete file", error));
    } else {
      toastr.info("Cancelled delete");
    }
  }

  var albums = [];

  if (mylistalbums) {
    if (mylistalbums.data) {
      var myalbumlister = mylistalbums.data.message;
      if (myalbumlister) {
        var myalbums = myalbumlister.map((slide, key) => {
          return (
            <ListGroup.Item key={key}>
              <Button
                onClick={() => {
                  deleteAlbum(albumName);
                }}
              >
                X
              </Button>
              <span
                onClick={() => {
                  viewAlbum(slide);
                }}
              >
                {" "}
                {slide}{" "}
              </span>
            </ListGroup.Item>
          );
        });
      } else {
        toastr.info("No Albums Found");
        myalbums = null;
      }
    }
  }

  if (photos.length > 0) {
    var photosarray = photos.map((photo, key) => {
      var folderkey = decodeURIComponent(
        decodeURIComponent(photo.substring(photo.lastIndexOf("/") + 1))
      );
      return (
        <ListGroup.Item key={key} className={'photolistview'}>
          <Card style={{ }}>
            <Card.Img variant="top" src={photo} />
            <Card.Body className={"cardbody"}>
              <Card.Title>
                {decodeURIComponent(
                  decodeURIComponent(
                    photo.substring(photo.lastIndexOf("/") + 1)
                  )
                )}
              </Card.Title>
              <Button
                onClick={() => {
                  deletePhoto(folderkey);
                }}
              >
                X
              </Button>
            </Card.Body>
          </Card>
        </ListGroup.Item>
      );
    });
  } else {
    photosarray = "No pictures in this folder";
  }

  return (
    <div>
      <link href="toastr.min.css" rel="stylesheet" />
      <div style={{ width: "100%" }}>
        <Navbar bg="light" expand="lg" id={"mynavbar"}>
          <Container >
            <Navbar.Brand href="#" style={{ fontFamily: "Lato" }}>
              S3 Viewer
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="navbarScroll" />
            <Navbar.Collapse id="navbarScroll">
              <Nav
                className="me-auto my-2 my-lg-0"
                style={{ maxHeight: "100px" }}
                navbarScroll
              >
                <Nav.Link href="#action1">Home</Nav.Link>
                <Nav.Link href="#action2">Link</Nav.Link>
                <NavDropdown title="Dropdown" id="navbarScrollingDropdown">
                  <NavDropdown.Item href="#action3">Action</NavDropdown.Item>
                  <NavDropdown.Item href="#action4">
                    Another action
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item href="#action5">
                    Something else here
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
              <Form className="d-flex">
                <FormControl
                  type="search"
                  placeholder="Search"
                  className="me-2"
                  aria-label="Search"
                />
                <Button variant="outline-success">Search</Button>
              </Form>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>
      <div className="container" style={{ paddingTop: "100px" }}>
        <h1>My Photo Albums App</h1>
        <Alert>Selected Album {albumName}</Alert>
        <div id={"maingrid"}>
          <div className={"dbpreview"}>
            <div>
              <Button
                variant="primary"
                id={"listalbumbutton"}
                onClick={() => listAlbums()}
              >
                List Albums
              </Button>
              <div id={"albumcss"}>{myalbums}</div>
              <ListGroup>{albums}</ListGroup>
            </div>

            <div id={"viewalbumcss"}>{photosarray}</div>

            <div id={"uploadphoto"}>
              <div>
                <Alert variant={"primary"}>
                  {" "}
                  Add a Photo to your Selected Album
                </Alert>
                <form
                  id="grabform"
                  method="post"
                  encType="multipart/form-data"
                  onChange={handleChanged}
                >
                  <input type="file" name="file" id='addfileinput' accept={'image/*'} />
                </form>
              </div>
              <br />
              <Alert variant={"primary"}>Create New Album</Alert>
              <form onSubmit={(e) => createalbum(e)}>
                <input
                  id="createalbumid"
                  name="avatar"
                  placeholder={"letters only"}
                  pattern="[A-Za-z]{2,}$"
                />
                <input type="submit" value={"submit"} />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
