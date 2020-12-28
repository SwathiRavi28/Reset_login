const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
var sessionStorage = require('sessionstorage');
var passwordHash = require('password-hash');
const dotenv = require("dotenv")
// Load User model
const User = require('../models/User');
dotenv.config()
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.user,
    pass: process.env.pass
  }
});

const mailOptions = {
  from: 'suuwathiravi1997@gmail.com', // sender address
  to: '', // list of receivers
  subject: 'Password reset', // Subject line
  html: ''// plain text body
};



// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        var hashedPassword = passwordHash.generate(password);
        newUser.password = hashedPassword;
        newUser
          .save()
          .then(user => {
            req.flash(
              'success_msg',
              'You are now registered and can log in'
            );
            res.redirect('/users/login');
          })
          .catch(err => console.log(err));
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  const { email, password } = req.body
  User.findOne({
    email: email
  }).then(user => {
    if (!user) {
      req.flash('error_msg', 'No user exist with this mail id');
      res.redirect('/users/login');
    } else {
      let value = passwordHash.verify(password, user.password)

      if (value) {
        res.redirect(`/dashboard/${email}/${user.name}`);
      } else {
        req.flash('error_msg', 'User id or password is incorrect');
        res.redirect('/users/login');
      }
    }
  });

});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

// Reset
router.get('/reset', (req, res) => {
  res.render('reset')
});

// Reset
router.post('/reset', async (req, res) => {
  console.log('i am in');
  var { email } = req.body;
  var hash;
  mailOptions.to = email;
  let errors = [];

  if (!email) {
    errors.push({ msg: 'Please enter all fields' });
  }


  if (errors.length > 0) {
    res.render('reset', {
      errors,
      email,
    });
  } else {

    try {
      const user = await User.findOne({ email: email })
      if (user != null) {
        hash = user.password;
      }
      else {
        errors.push({ msg: 'Email doesnt exists' });
        res.render('reset', {
          errors,
          email,
        });
      }
    }
    catch (err) {
      console.log(err)
    }

    let sampleMail = '<p>Hi, </p>'
      + '<p>Please click on below link to reset password</p>'
      + `<a target='blank' href="https://resetlogin.herokuapp.com/users/resethome/${hash}/${email}" >Reset your password</a>`
      + '<p>Regards</p>'
    mailOptions.html = sampleMail;
    console.log('hashed password', hash)
    // var email = localStorage.getItem("email");
    console.log('email in reset', email);
    await transporter.sendMail(mailOptions)
    res.status(200).json({
      message: "Verification mail sent"
    });

  }
});

router.get('/resethome/:pwd/:email', (req, res) => {
  sessionStorage.setItem('email', req.params.email);
  console.log('email stored', sessionStorage.getItem('email'));
  res.render('resethome')
})

router.post('/resethome', (req, res) => {
  console.log('i am in now');
  const email = sessionStorage.getItem('email')
  const { password1, password2 } = req.body;
  let errors = [];

  if (!password1 || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password1 != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password2.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('reset', {
      errors,
      email,
      password1,
      password2
    });
  } else {

    var hash = passwordHash.generate(password1);
    console.log('hashed password', hash)
    // var email = localStorage.getItem("email");
    console.log('email in reset', email)
    User.findOneAndUpdate({ email: email },
      { $set: { password: hash } }, {
      returnNewDocument: true
    }, function (err, docs) {
      if (err) {
        console.log(err)
      }
      else {
        //console.log("Original Doc : ", docs);
        req.flash(
          'success_msg',
          'Password reset successfull'
        );
        res.redirect('/users/login');
      }
    }).then(res => console.log('success'))
      .catch(err => console.log(err))
  }
});

module.exports = router;
