'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongo = require('mongodb');
const mongoose = require('mongoose');

const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

function randomString(length) {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const urlSchema = new mongoose.Schema({
  original: String,
  short: { 
    type: String,
    unique: true,
    default: () => (randomString(5))
  }
});

const ShortURL = mongoose.model('ShortURL', urlSchema);


function isValidURL(urlString, callback) {

  let url;
  try {
    url = new URL(urlString);
  } catch(error) {
    return callback(false);
  }
  if(!/http(s?):/.test(url.protocol)) {
    return callback(false);
  }
  dns.lookup(url.host, function(err, address, family) {
    if(err) {
      return callback(false);
    }
  });
  callback(true);

}

app.post('/api/shorturl/new', function(req, res) {
  isValidURL(req.body.url, function(valid) {
    if(valid) {
      let url = new ShortURL({original: req.body.url});
      url.save(function(err, shortUrl) {
        if(err) res.sendStatus(500);
        else res.json({ original_url: url.original, short_url: url.short });
      });
    } else {
      res.json({ error: 'invalid URL' });
    }
  });
});

app.get('/api/shorturl/:short', function(req, res) {
  ShortURL.findOne({ short: req.params.short }, function(err, url) {
    if(err) res.sendStatus(404);
    else res.redirect(url.original);
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});