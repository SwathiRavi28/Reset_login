const express = require('express');
var LocalStorage = require('node-localstorage').LocalStorage,
  localStorage = new LocalStorage('./scratch');
const router = express.Router();

router.get('/', (req, res) => res.render('welcome'));
router.get('/reset', (req, res) => res.render('reset'));
router.get('/dashboard/:email/:name', (req, res) => {

  if (typeof (req.params.email) !== "undefined") {

    localStorage.setItem("email", req.params.email);
  } else {
    alert("Sorry, your browser does not support Web Storage...");
  }

  var name = req.params.name;
  res.render('dashboard', {
    user: name
  })
}

);

module.exports = router;
