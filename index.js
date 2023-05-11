const dotenv = require('dotenv');
dotenv.config();

const url = require('url');
const express = require('express');
const session = require('express-session');

const storyRoutes = require('./routes/story');

const app = express();

app.use(session({
    secret: process.env.NODE_SESSION_SECRET,
    resave: true,
    saveUninitialized: false
}));

// Story Initialization Middleware
app.use((req, res, next) => {
    if (typeof req.session.summary === 'undefined') {
      req.session.summary = '';
    }
    for (let i = 1; i <= 4; i++) {
      if (typeof req.session[`event${i}`] === 'undefined') {
        req.session[`event${i}`] = '';
      }
    }
    if (typeof req.session.currentEvent === 'undefined') {
      req.session.currentEvent = 0;
    }
    next();
});

app.set('view engine', 'ejs');

const port = process.env.PORT || 3000;

// Generates Story Page
app.use('/story', storyRoutes);


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
