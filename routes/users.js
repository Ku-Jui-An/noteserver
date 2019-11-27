var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var fs = require('fs');
var qs = require("querystring");
var wkhtmltopdf = require('wkhtmltopdf');
var path = require('path');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.post('/pdf2',function (req,res,next) {
    var db=req.connection;
    var idArray= new Array();
    var a=req.body['notedata['+0+'][id]'];
    var question=new Array();
    var answer=new Array();
    var num=0;
    //var b=JSON.parse(a);
    for(var i in req.body.notedata)
    {
        console.log(i);
        idArray[num]=req.body.notedata[num].id;
        num++;
    }
    //console.log(a);
    console.log(idArray);
    var sql='SELECT question,answer from note where id in ('+ idArray +')';
    db.query(sql,function(err,row) {
        if (err)
            console.log("錯誤警告" + err);
        else {
            for (var i in row) {
                question[i] = row[i].question;
                answer[i] = row[i].answer;
            }

            console.log(question);
            console.log(answer);

            var htmlStart = '<html><meta http-equiv="content-type" content="text/html;charset=utf-8"><body>';
            var htmlEnd = '</body></html>';

            var htmlquestion = '';
            var num=1;
            for(var i in question){
                htmlquestion += '<hr>'
                    + '<h3>' + num + '.&nbsp;' + question[i] + '</h3><br>';
                num += 1;
            }
            var htmlanswer = '';
            var num2=1;
            for(var i in answer){
                htmlanswer += '<hr>'
                    + '<h3>' + num2 + '.&nbsp;' + answer[i] + '</h3><br>';
                num2 += 1;
            }
            var chinese=''
            var html = htmlStart + htmlquestion + htmlanswer + htmlEnd;
            console.log(html);
            var pdfOptions = {format: 'Letter'};
            var floor = Math.floor(Math.random()*10000000);
            var pdfname = question[0] + floor + '.pdf';
            var pdfpath = './Correction-Note/pdf'+ pdfname;
            wkhtmltopdf(html, {output: pdfpath},function (err,result) {
                if (err) {
                    console.log('error in pdf.create(), err=', err);
                    res.send(err);
                }
                else {
                    // var fileName = "../out.pdf";
                    // var newfileName="out.pdf";
                    // var sourceFile = path.join(__dirname, fileName);
                    // var destPath = path.join(__dirname, "../public", newfileName);
                    //
                    // fs.rename(sourceFile, destPath, function (err) {
                    //     if (err) throw err;
                    //     fs.stat(destPath, function (err, stats) {
                    //         if (err) throw err;
                    //         console.log('stats: ' + JSON.stringify(stats));
                    //     });
                    // });

                    console.log("傳送下載連結");
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Access-Control-Allow-Origin','*');
                    res.send("http://35.206.219.27/pdf/"+pdfname);
                }
            });
        }
    });
});


router.post('/pdf1',function (req,res,next) {
  var db=req.connection;
  var idArray= new Array();
  var a=req.body['notedata['+0+'][id]'];
  var question=new Array();
  var answer=new Array();
  var num=0;
  //var b=JSON.parse(a);
  for(var i in req.body)
  {
    console.log(i);
    idArray[num]=req.body['notedata['+ num +'][id]'];
    num++;
  }
  //console.log(a);
  console.log(idArray);
  var sql='SELECT question,answer from note where id in ('+ idArray +')';
  db.query(sql,function(err,row) {
    if (err)
      console.log("錯誤警告" + err);
    else {
      for (var i in row) {
        question[i] = row[i].question;
        answer[i] = row[i].answer;
      }

      console.log(question);
      console.log(answer);

      //var json = fs.readFileSync('C:\\Users\\user\\IdeaProjects\\note-server\\bookstore.json', 'utf8');
      //var obj = JSON.parse(json);
      var htmlStart = '<html><body>';
      var htmlEnd = '</body></html>';

      var htmlquestion = '';
      var num=1;
      for(var i in question){
        htmlquestion += '<hr>'
            + '<h3>' + num + '.&nbsp;' + question[i] + '</h3><br>';
        num += 1;
      }
      var htmlanswer = '';
      var num2=1;
      for(var i in answer){
        htmlanswer += '<hr>'
            + '<h3>' + num2 + '.&nbsp;' + answer[i] + '</h3><br>';
        num2 += 1;
      }
      var html = htmlStart + htmlquestion + htmlanswer + htmlEnd;
      console.log(html);
      var pdfOptions = {format: 'Letter'};


      wkhtmltopdf(html, {output: 'out.pdf'},function (err,result) {
        if (err) {
              console.log('error in pdf.create(), err=', err);
              res.send(err);
            } else {
              var pdfbase64=new Array();
              let filePath = path.resolve('./out.pdf');
              let data = fs.readFileSync(filePath);
              pdfbase64 = new Buffer.from(data).toString('base64');
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Access-Control-Allow-Origin','*');
              res.json(pdfbase64);
            }
      });
    }
  });
});
module.exports = router;
