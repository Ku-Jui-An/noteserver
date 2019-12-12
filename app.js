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
}

handleDisconnection();


app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'Correction-Note')));
app.use(bodyParser.json({limit:"20mb"}));
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

let query = function (sql, values) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err)
            } else {
                connection.query(sql, values, (err, rows) => {
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
app.post('/uploads',async function (req, res, next) {
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
    await check_pic(picmark,noteid);
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

async function check_pic(picmark,noteid){
    console.log("184: "+ picmark);
    console.log("185: "+ noteid);
    let sql;
    let picurl;
    let picname = new Array();
    if(picmark=="answer")
       sql="SELECT answer_pic FROM note WHERE id =" + noteid;
    else if(picmark=="question")
       sql="SELECT question_pic FROM note WHERE id =" + noteid;
    console.log("190: " + sql);
    await new Promise((resolve)=> {
        connection.query(sql,function(err,rows){
            if(err){
                console.log("圖片搜尋失敗: " + err);
                resolve(1);
            }
            else{
                if(rows!=null){
                    if(picmark="answer")
                        picurl=rows[0].answer_pic;
                    else if(picmark="question")
                        picurl=rows[0].question_pic;
                    picname=picurl.split("/");
                    fs.unlink("./Correction-Note/images/"+picname[4], function (err) {
                        if(err)
                            console.log("刪除檔案失敗: "+ err);
                        else
                            console.log('已經刪除檔案!');
                    });
                }
                resolve(0);
            }
        });
    });
    return "success";
}
app.post('/test1',async function(req,res) {
    var picmark = req.body.mark;
    var noteid = req.body.id;
    await check_pic(picmark,noteid);
    res.send("hello");

});
app.post('/getNote', async function (req, res, next) {
    var sql = {
        user_id: req.body.id
    };
    let floor=req.body.floor;
    let range=10;
    let notId = [];
    let returnMainData = [];
    let data = returnMainData;
    let i = 0;
    let r=0;
    let x = new Array();
    returnMainData["main"] = {};
    let sql2 = 'Select * From note where ? ORDER BY id DESC Limit '+ floor + ',' + range;
    let sql3='SELECT COUNT(*) as total FROM note where ?';
    let rows=await query(sql3,sql);
    rows.forEach(async function(index,value) {
       returnMainData['main']['Max']={
           MAX:index.total
       };
       x[0]=returnMainData['main']['Max'];
    });
    rows = await query(sql2, sql);
    rows.forEach(async function (index, value) {
        let name = index.id;
        //console.log(name);
        returnMainData["main"][name];
        returnMainData["main"][name] = {
            "id": index.id,
            "title": index.title,
            "content": index.content,
            "question_pic":index.question_pic,
            "tag": []
        };
        r++;
        console.log(returnMainData["main"][150]);
        notId.push(index.id);
        //console.log(notId)
        sql = [];
        notId.forEach(async function (index, value) {
            sql.push({
                note_id: notId[value]
            });
        });
        await sql;
        let counter = sql.length - 1;

        sql.forEach(async function (a1, b1) {
            //console.log(b1);
            rows = await query("select * from mark where ?", sql[b1]);
            sql = [];
            rows.forEach(async function (index, value) {
                sql.push({
                    id: rows[value].label_id
                });

            });
            await sql;
            let counter2 = sql.length - 1;
            sql.forEach(async function (a2, b2) {
                rows = await query("select name from label where ?", a2)
                await rows;
                let counter3 = rows.length - 1;
                rows.forEach(async function (index, value) {

                    if (returnMainData["main"][a1.note_id].tag.indexOf(rows[value].name)) {
                        returnMainData["main"][a1.note_id].tag.push(rows[value].name);
                    }
                    data = await returnMainData;
                    if (counter == b1 && counter2 == b2 && value == counter3 && i == 0) {
                        console.log(r);
                        for(let y=1,z=0;y<=r;y++,z++) {
                            console.log(returnMainData["main"][notId[z]]);
                            x[y]=returnMainData["main"][notId[z]];
                        }
                        res.json(x);
                        i = 1;
                    }

                })


            });
        })
    });
    await rows
    // console.log(returnMainData["main"]["34"].tag);
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
