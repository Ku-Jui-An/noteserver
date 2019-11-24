var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require("body-parser");
var url = require('url');
var app = express();
var formidable = require('formidable');
var sd = require('silly-datetime');
var multer1  = require('multer');
var pdf = require('html-pdf');
var fs = require('fs');

var routes = require('./routes/index');
var usersRouter = require('./routes/users');
var login = require('./routes/login');
// var mysql = require('mysql');

// var connection = mysql.createConnection({
//   host     : '35.213.23.117',
//   port     : '3306',
//   user     : 'Andrew',
//   password : 'Andrew93220@',
//   database : 'Notebook'
// });


//連接資料庫
// connection.connect(function(err) {
//   if (err) {
//     console.log('connecting error '+ err);
//     return;
//   }
//   console.log('connecting success');
// });

var mysql = require('mysql');
var mysql_config={
  host     : '35.206.219.27',
  port     : '3306',
  user     : 'Andrew',
  password : 'Andrew93220@',
  database : 'Notebook'
};
var connection;
function handleDisconnection() {
  connection = mysql.createConnection(mysql_config);
  connection.connect(function(err) {
    if(err) {
      setInterval(handleDisconnection, 2000);
    }
    else{
      console.log('connecting success');
    }
  });
  connection.on('error', function(err) {
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnection();
    }
    else {
      throw err;
    }
  });
};

handleDisconnection()


app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit:"2100000kb"}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/',login);

app.post('/',function(req,res,next){
  var Cookieuid=req.cookies.uid;
  var data=[];
  console.log(Cookieuid);
  var sql={
    uid:Cookieuid
  };
  connection.query("select id,name from user where ?",sql,function(err,row,next){
    if(err) {
      res.end(err);
    }
    else {
      res.json(row);
      next();
    }
  })
});


app.use(function(req, res, next) {
  req.connection = connection;
  next();
});


app.use('/routes',routes);
app.use('/users', usersRouter);



var storage = multer1.diskStorage({
  //儲存的位址，會儲存在uploads的目錄裡
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  //修改檔名，最後的.jpg可以改成其他格式
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+'.jpg')
  }
});

var upload = multer1({ storage: storage });

//單圖上傳
//upload.single('file')的file盡量跟<input>的name一致
app.post('/uploads', function(req, res,next){
  let data_url = req.body.baseimg;
//var buff = new Buffer.from(data_url.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');

  let matches = data_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};
  let current_datetime = new Date();
  let formatted_date = current_datetime.getFullYear() + "-" + (current_datetime.getMonth() + 1) + "-" + current_datetime.getDate() + "-" + current_datetime.getHours() + "-" + current_datetime.getMinutes() + "-" + current_datetime.getSeconds();
  let dateString = formatted_date.toString();
  response.type = matches[1];
  response.data = new Buffer.from(matches[2], 'base64');
  console.log(dateString);
  fs.writeFile(path.join(__dirname,'/uploads/',dateString+"."+response.type.split("/")[1]), response.data, function(error){
    if(error){
      throw error;
    }else{
      console.log('File created from base64 string!');
      return true;
    }
  });
  if(req.body.toText){
    test(__dirname+'/uploads/'+dateString+"."+response.type.split("/")[1],res);
  }
});

async function test(urls,res) {

  const vision = require('@google-cloud/vision');

// Creates a client
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection(urls);
  const detections = result.textAnnotations;
  console.log('Text:');
  console.log(detections[0].description);

  let translateText ={"text":detections[0].description};
  fs.unlink(urls,function(err){
    if(err) throw err;

    console.log('File deleted!');
  });
  res.json(translateText);
}

app.get("/readimage",function(req,res,next){
  client
      .textDetection('2019-10-15-13-14-33.jpeg')
      // Creates a client
      .then(results =>{
        var final = [];
        const labels = results[0].textAnnotations;
        console.log('Labels:');
        // labels.forEach(function(answer){
        //         final=answer;
        // });
        res.json(labels);
      })
      .catch(err =>{
        console.error('ERROR:',err);
      })
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
