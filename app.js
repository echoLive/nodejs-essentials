const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const errorController = require('./controllers/error');
const User = require('./models/user');
const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@myprojects-ggr2u.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

//csrf token
const csrfProtection = csrf();
//image upload
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getMilliseconds().toString() + '-' + file.originalname);
  }
});
//image upload with specified types
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//view engine pug/ejs to dynamicly control front end
app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));

//default root directories for css,js,images(Static Files)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

//Session usage
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
//use the csrf token in middleware
app.use(csrfProtection);
//frontend validation with flash
app.use(flash());

//Check to see if user logged in and csrf token is valid
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//control the user input by checking the user-session-id from body
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

//use routes with admin--> /admin/etc. 
//                shop--> /etc.
//                auth--> /etc.     (all of them is in the route folder)
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/api/test', (req, res) => {
  res.send({ hello: 'world' });
});

//Control the 500 status code which is server error
app.get('/500', errorController.get500);

//Control the 404 status code which is page not Found!
app.use(errorController.get404);

//Error middleware for 500 status code for logical mistakes(CODE MISTAKES)
app.use((error, req, res, next) => {
  res.status(500).render('500', {
    pageTitle: 'Sorry :(',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
  });
})

//Connect the mongodb and start the server
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    port = process.env.PORT || 3000
    app.listen(port);
  })
  .catch(err => {
    console.log(err);
  });
