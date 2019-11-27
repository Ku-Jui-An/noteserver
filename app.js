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
app.use(express.static(path.join(__dirname, 'Correction-Note')));
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

const pool = mysql.createPool({
  host: '35.206.219.27',
  user: 'Andrew',
  password: 'Andrew93220@',
  database: 'Notebook'
});

let query = function (sql) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        reject(err)
      } else {
        connection.query(sql, (err, rows) => {

          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
          connection.release()
        })
      }
    })
  })
};

module.exports = query;

//單圖上傳
//upload.single('file')的file盡量跟<input>的name一致
app.post('/uploads', function (req, res, next) {
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
  let picname = dateString + "." + response.type.split("/")[1];
  fs.writeFile(path.join(__dirname, '/Correction-Note/images', picname), response.data, function (error) {
    if (error) {
      throw error;
    } else {
      console.log('File created from base64 string!');
      return true;
    }
  });
  if (req.body.toText) {
    test(__dirname + '/Correction-Note/images' + dateString + "." + response.type.split("/")[1], res);
  }
  else{
    var picmark = req.body.mark;
    var noteid = req.body.note_id;
    var picpath="http://35.206.219.27:3000/images/"+picname;
    if(picmark="answer"){
      var sqldata = {
        answer_pic:picpath
      }
    }else if(picmark="question"){
      var sqldata = {
        question_pic:picpath
      }
    }
    console.log(sqldata);
    var sql = "UPDATE note SET ? WHERE id = ?";
    connection.query(sql,[sqldata,noteid],function(err,rows){
      if(err)
        console.log("圖片路徑添加失敗"+err);
      else
        console.log("圖片路徑添加成功");
    });
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

app.post('/getNote', async function (req, res, next) {
  var range = 10;
  var sql2 = 'Select * From note where user_id=' + req.body.id + ' ORDER BY id DESC Limit ' + req.body.floor + ',' + range;
  var sql3 ='SELECT COUNT(*) as total FROM note where user_id = '+ req.body.id;
  let sql;
  let notId;
  let returnMainData = [];
  let max;
  let maxsql = await query(sql3);
  maxsql.forEach(async function(index,value) {
    max = index.total;
  });
  returnMainData["main"] = {};
  let rows = await query(sql2);
  rows.forEach(async function (index, value) {
    let name = "data" + value;
    returnMainData["main"][name];
    returnMainData["main"][name] = {
      "id": index.id,
      "title": index.title,
      "content": index.content
    };
    notId = index.id;
  });
  console.log(notId);
  let name = "";
  sql2="select * from mark where note_id="+ notId;
  rows = await query(sql2);

  rows.forEach(async function (index, value) {
    sql = rows[value].label_id;

    name = "data" + value;
    returnMainData["main"][name]["tag"] = [];
  });
  console.log("tagid="+sql);
  sql2 ="select name from label where id="+sql;
  rows = await query(sql2);

  rows.forEach(async function (index, value) {
    console.log(rows.length)
    console.log(value)
    returnMainData["main"][name]["tag"].push(rows[value].name);
  });
  res.json({
    max:max,
    note:returnMainData["main"]
  });

  const data = await returnMainData;

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
