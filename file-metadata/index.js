const express = require('express');
const multer  = require('multer');
const upload = multer();
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.post("/api/fileanalyse", upload.single('upfile'), (req, res) => {
  try{
    let response = {
      "name": req.file.originalname,
      "type": req.file.mimetype,
      "size": req.file.size,
    };
    res.json(response);
  } catch(e){
    res.json({"error": "an error occurred while trying to upload your file"});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});