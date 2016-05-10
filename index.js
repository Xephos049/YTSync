var fs = require('fs');
var http = require('http');
var file = "vidsync.html";
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://ec2-54-187-86-74.us-west-2.compute.amazonaws.com:27017/webappdb';
//var mongourl = 'mongodb://localhost:27017/webappdb';
//var mongourl = 'mongodb://ds013172.mlab.com:13172/heroku_b371r9tw';

var insertUrlTest = function(db, callback) {
    db.collection('savedurls').insertOne( {"shorturl": "1", "vid1": "1", "vid2": "1", "off1": "1s", "off2": "1s"}, function(err, result) {
	assert.equal(err, null);
	console.log("test case inserted");
	callback();
});

};

//MongoClient.connect(mongourl, function(err,db) {
//    assert.equal(null, err); 
//    insertUrlTest(db, function() {
//	db.close();
//});

//});

var requestListener = function (req, res) {
  //Determine which of the three types of request this is:
  //1. A save request: Save the parameters as a short url, return short url.
  //2. A short request: retrieve the longer url and return it as a redirect.
  //3. A generic (long) request: return vidsync.html

  var url = require('url').parse(req.url, true);

  //Check for "save" as the request  
  if (/^\/save/.exec(url.pathname)) {
    //Parse the values from the url.
    console.log("Vid1 = " + url.query.vid1 + ", Vid2 = " + url.query.vid2 + ", off1 = " + url.query.off1 + ", off2 = " + url.query.off2);
    //Generate a short url
    var shortUrl = "test";


    //Gets next auto increment integer index from database for the given collection
    var getNextSequence = function(db, callback) {
      db.collection('counters').find({_id: 'shorturl'}).each(function(err, doc){
        if (doc != null) {
          console.log("Found seq: " + doc.seq);
          doc.seq++;
          db.collection('counters').save(doc);
          doc.seq--;
          callback(doc.seq);
        }
      });
    }
    
    // and save it to the DB with the values
    var insertShortUrl = function(db, callback) {
	db.collection('savedurls').insertOne( {"shorturl": "" + shortUrl, "vid1": url.query.vid1, "vid2": url.query.vid2, "off1": url.query.off1, "off2": url.query.off2}, 
					      function(err, result) {
						  assert.equal(err, null);
						  console.log("shorturl inserted");
						  callback();
					      });
    };


     /*
    MongoClient.connect(mongourl, function(err,db) {
      assert.equal(null, err);
      getNextSequence(db, function(seq) {
        console.log("ShortURL: " + seq);
        shortUrl = seq;
        insertShortUrl(db, function() {
          db.close();
          //Return the short url
          console.log("Finished insert, returning shorturl: " + shortUrl);
          res.writeHead(200);
          res.end("" + shortUrl);
        });
      });
    });
     */ 
      
      MongoClient.connect(mongourl, function(err,db) {
	  assert.equal(null, err);
      //check if record to be inserted already exists
      //var cursor1 = db.collection('savedurls').find({'vid1': url.query.vid1, 'vid2': url.query.vid2, 'off1': url.query.off1, 'off2': url.query.off2});
      // var doc1 = db.collection('savedurls').findOne({'vid1': url.query.vid1, 'vid2': url.query.vid2, 'off1': url.query.off1, 'off2': url.query.off2});//, console.log);
	 /* db.collection('savedurls').findOne({'vid1': url.query.vid1, 'vid2': url.query.vid2, 'off1': url.query.off1, 'off2': url.query.off2}, function(err, newurl) {
	      if(err){
	      console.log(err);
	      } else {//if (newurl) {
		  if (doc1 == null)//if record does not already exist
		  {
		      getNextSequence(db, function(seq) {
			  console.log("ShortURL: " + seq);
			  shortUrl = seq;
			  insertShortUrl(db, function() {
			      db.close();
			      //Return the short url
			      console.log("Finished insert, returning shorturl: " + shortUrl);
			      res.writeHead(200);
			      res.end("" + shortUrl);
			  });
		      });
		  }
		  else { //if record does already exist in db
		      console.log("record already exists in database")
		      res.writeHead(200);
		      res.end("" + doc1.shorturl);
		  }
	      }
	  });
	  */
	  //db.collection('savedurls').find({'vid1': url.query.vid1, 'vid2': url.query.vid2, 'off1': url.query.off1, 'off2': url.query.off2}).each(function(err, doc1) {
	  db.collection('savedurls').findOne({'vid1': url.query.vid1, 'vid2': url.query.vid2, 'off1': url.query.off1, 'off2': url.query.off2}, function(err, doc1) {   
	      if (doc1 == null) {
		  getNextSequence(db, function(seq) {
                      console.log("ShortURL: " + seq);
                      shortUrl = seq;
                      insertShortUrl(db, function() {
			  db.close();
			  //Return the short url 
			  console.log("Finished insert, returning shorturl: " + shortUrl);
			  res.writeHead(200);
			  res.end("" + shortUrl);
                      });
		  });
	      }
	      else {
		  //if record does already exist in db
		  console.log("record already exists in database")
		  res.writeHead(200);
		  res.end("" + doc1.shorturl);
	      }
	  });
	  /*
	  if (doc1 == null)//if record does not already exist
	  {
              getNextSequence(db, function(seq) {
		  console.log("ShortURL: " + seq);
		  shortUrl = seq;
		  insertShortUrl(db, function() {
		      db.close();
		      //Return the short url
		      console.log("Finished insert, returning shorturl: " + shortUrl);
		      res.writeHead(200);
		      res.end("" + shortUrl);
		  });
              });
	  }
	  else { //if record does already exist in db
              console.log("record already exists in database")
              res.writeHead(200);
              res.end("" + doc1.shorturl);
	  }
	  */
      });
      
      
  }
  //Check for short url
    else if (/^\/\d+$/.exec(url.pathname)) {
	//Parse the short url.
    console.log(url.pathname);

    var currentUrl = url.pathname.substring(1, url.pathname.length);;
    //Retrieve the parameters from the DB.
      //function to retrieve data corresponding to currentUrl
    console.log("currentUrl: " + currentUrl);
    var calledBack = false;
    var getShorturlData = function(db, callback) {
	var cursor = db.collection('savedurls').find( {"shorturl": currentUrl });
	cursor.each(function(err, doc) {
            console.log("Finished query");
	    assert.equal(err, null);
	    if (!calledBack) {
                calledBack = true;
		console.dir(doc);
                callback(doc);
	    }
	});
    };
      //call to function to retrieve data corresponding to currentUrl
    MongoClient.connect(mongourl, function(err, db) {
	assert.equal(null, err);
	getShorturlData(db, function(doc) {
          console.log("Returning long url");
	  db.close();
          //Construct the longer url.
          var redirect = '/';

          //Input values from db
          if (doc != null) {
            redirect += "?vid1=" + doc.vid1 + "&vid2=" + doc.vid2 + "&off1=" + doc.off1 + "&off2=" + doc.off2;
          }
          //Return the longer url with response code 302.
          res.writeHead(302, {'Location': redirect});
          res.end();
        });
    });
  }
  //Otherwise, it is a generic long request.
  else {
    //Check if file exists and get its size.
    fs.stat(file, function (err,stats) {
      if (err) {
        res.writeHead(404);
        res.end("File not found!");
        return console.log(err);
      }
      //Open file.
      fs.open(file, 'r', function (err,fd) {
        if (err) {
          res.writeHead(404);
          res.end("File not found!");
          return console.log(err);
        }

        var buffer = new Buffer(stats.size);
        //Read file.
        fs.read(fd, buffer, 0, stats.size, 0, function (err,bytesRead,buffer) {
          if (err) {
            res.writeHead(500);
            res.end("Error reading file!");
            return console.log(err);
          }

          //Write file to response.
          res.writeHead(200);
          res.end(buffer.toString('utf8'));
        });
      });
    });
  }
};

var server = http.createServer(requestListener);
server.listen(process.env.PORT || 8080);
