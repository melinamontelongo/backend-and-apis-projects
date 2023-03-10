require('dotenv').config();
const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;

//  Mongoose config //
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    count: Number,
    log: Array
});
let User = mongoose.model('User', userSchema);

//  Express config  //
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static(__dirname + '/public'));

//  Views   //
app.get("/", (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
})

app.route("/api/users")
    //  Save new user
    .post(async (req, res) => {
        const username = req.body.username;
        let result;
        try {
            result = await User.create({ username: username });
            res.json({ "username": result.username, "_id": result._id });
        }
        catch (e) {
            console.log(e)
            res.json({ error: "cannot save user" });
        }
    })
    //  Get all users
    .get(async (req, res) => {
        let result;
        try {
            result = await User.find({}, { count: 0, log: 0 }); // Exclude these fields
            res.json(result);
        }
        catch (e) {
            console.log(e)
            res.json({ error: "cannot get users" });
        }
    })

//  Add new exercise to an existing user
app.post("/api/users/:_id/exercises", async (req, res) => {
    const userId = req.params._id;
    let { description, duration, date } = req.body
    let newExercise, updatedUser;
    let response = {};
    try {
        //  Set current date if no date is provided
        date == "" || !date || date === undefined ? date = new Date() : date = new Date(date);
        //  Create new exercise object
        newExercise = {
            description: description,
            duration: parseInt(duration),
            date: date.toDateString()
        };
        //  Add exercise to user's log
        updatedUser = await User.findOneAndUpdate({ _id: userId }, { $inc: { count: 1 }, $push: { log: newExercise } }, { new: true });
        //  Response: user + exercise added data    
        response = {
            "_id": updatedUser._id,
            "username": updatedUser.username,
            "date": newExercise.date,
            "description": newExercise.description,
            "duration": newExercise.duration,
        }
        res.json(response);
    } catch (e) {
        console.log(e)
        res.json({ "error": "something went wrong" });
    }
});

app.get("/api/users/:id/logs", async (req, res) => {
    const userId = req.params.id;
    let { from, to, limit } = req.query;
    let user, exerciseLog;
    let response = {};
    try {
        //  Find user
        user = await User.findById(userId, { __v: 0 });
        if (!user) res.json({ "error": "user not found" });
        //  User fields
        response = {
            "_id": user._id,
            "username": user.username
        };
        exerciseLog = user.log;
        //  Date queries were given
        if (from || to) {
            //  Convert to date format && set from/to keys || defaults
            from ? (from = new Date(from), response["from"] = new Date(from).toDateString()) : from = new Date(0);
            to ? (to = new Date(to), response["to"] = new Date(to).toDateString()) : to = new Date();
            //  Convert to unix so they can be compared
            from = from.getTime();
            to = to.getTime();
            //  Filtering by dates
            exerciseLog = exerciseLog.filter((log) => {
                let exerciseDate = new Date(log.date).getTime();
                //  Return within given range
                return exerciseDate >= from && exerciseDate <= to
            });
        }
        //  Limit was given
        if (limit) {
            exerciseLog = exerciseLog.slice(0, limit);
        }
        //  Exercise log count
        response["count"] = exerciseLog.length;
        //  Exercise fields
        response["log"] = exerciseLog;
        console.log(response)
        //  Response = user + from/to dates? + log array length + log array
        res.json(response);
    } catch (e) {
        console.log(e)
        res.json({ "error": "something went wrong" });
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})