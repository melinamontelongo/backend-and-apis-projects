const express = require("express");
const cors = require('cors')
const app = express();
const port = 3000;

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
})

app.get("/api/whoami", (req, res) => {
    let result;
    result = { "ipaddress": req.ip, "language": req.get("accept-language"), "software": req.get("user-agent") };
    res.json(result)
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})