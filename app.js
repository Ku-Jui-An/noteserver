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
const vision = require('@google-cloud/vision');
var pdf = require('html-pdf');
var fs = require('fs');

var routes = require('./routes/index');
var usersRouter = require('./routes/users');
var login = require('./routes/login');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : '35.213.23.117',
  port     : '3306',
  user     : 'root',
  password : '205025',
  database : 'Notebook'
});


//連接資料庫
connection.connect(function(err) {
  if (err) {
    console.log('connecting error');
    return;
  }
  console.log('connecting success');
});

app.use(logger('dev'));
app.use(express.json({limit:"2100000kb"}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit:"2100000kb"}));
app.use(bodyParser.urlencoded({ extended: false }));
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
app.post('/uploads', upload.array('file',3), function(req, res,next){
  var file = new Array(3);
  var url = new Array(3);
  for(var i=0;i<3;i++)
  {
    file[i]=req.files[i];
    if(!file[i])
      url[i]=" ";
    else
      url[i]='http://35.213.23.117/database/uploads'+file[i].filename;
  }
  var sql = {
    picture1:url[0],
    picture2:url[1],
    picture3:url[2]
  };
  console.log(url);
  // language=SQL format=false
connection.query("UPDATE note SET ? WHERE id = 16",sql,function(error,results,fields){
    if(error){
      res.end('添加失败:'+error);
    }
    else
    {
      res.setHeader('Content-Type', 'application/json');
      res.json(sql);
    }
  });
});


const client = new vision.ImageAnnotatorClient();
app.get("/readimage",function(req,res,next){
  client
      .textDetection('chinese.jpg')
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
