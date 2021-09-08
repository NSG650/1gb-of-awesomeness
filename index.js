const http = require('http');
const express = require('express');
const app = express();
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

const get_all_files = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = get_all_files(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, file));
    }
  });
  return arrayOfFiles;
}

const get_total_size = function(directoryPath) {
  const arrayOfFiles = get_all_files(directoryPath);
  let totalSize = 0;
  arrayOfFiles.forEach(function(filePath) {
    totalSize += fs.statSync(filePath).size;
  });
  return totalSize / (1024 * 1024);
}

app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.render('index', {total_size: (get_total_size("./files"))});
});

app.use("/data", express.static(__dirname + "/files"));

app.get("/get-files", (req, res) => {
    var string = "<style> h1 {font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;} p {font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}</style><h1> File Listing: </h1>";
    fs.readdirSync("./files").forEach(file => {
        string += `<p><a href="data/${file}">${file}</a></p>`;
    });
    res.send(string);
});

app.post("/file-upload", (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var timeStamp = Date.now();
    if(files["filetoupload"] == undefined) {
      return res.render("failure", {error: "FILE_FAILED_TO_UPLOAD"});
    }
    var oldPath = files["filetoupload"].path;
    var newPath = path.join(__dirname, `files/${timeStamp}_${files["filetoupload"].name}`);
    var rawData = fs.readFileSync(oldPath);
    if (files["filetoupload"].size < 1) {
      return res.render("failure", {error: "FILE_SIZE_TOO_SMALL"});
    }
    var calc_after_file_add_size = get_total_size("./files") + files["filetoupload"].size / (1024 * 1024);
    if (calc_after_file_add_size > 950) {
      return res.render("failure", {error: "FILE_SIZE_TOO_LARGE"});
    }
    fs.writeFile(newPath, rawData, function(err){
        if(err) res.send(err);
        return res.render("success", {file_name: files["filetoupload"].name, 
                                      file_name_x: (timeStamp + "_" + files["filetoupload"].name), 
                                      size: (files["filetoupload"].size / (1024 * 1024))});
    });
  });
});

app.listen(8080, () => {
  console.log("up and running")
})