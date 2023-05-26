const express = require('express');
const router = express.Router();
const ObjectId = require('mongodb').ObjectId;

const { userCollection,
    userSavedCollection
} = require('../.././databaseConnection.js');

router.get("*", async(req,res) => {

    if (!req.session.authenticated) {
        res.redirect("/userLoginScreen");
        return;
    }

    var user = await userCollection.collection.findOne(
        { _id: new ObjectId(req.session.userID) });

    var stories = await userSavedCollection.collection.find(
        { userID: req.session.userID}).toArray();
    
    res.render("loadGame", {stories: stories});
});

module.exports = router;