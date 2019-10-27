var express = require('express');
var router = express.Router();
var pdf = require('html-pdf');
var fs = require('fs');
var qs = require("querystring");
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/pdf2',function (req,res) {
  var db=req.connection;
  var idArray= new Array();
  var a=JSON.stringify(req.body);
  var question=new Array();
  var answer=new Array();
  //var b=JSON.parse(a);
  idArray=a.split('"');
  for(var i in idArray)
      idArray.splice(i,1);
  for(var i in idArray)
    idArray.splice(i,1);
  console.log(a);
  console.log(idArray);
  var sql='SELECT question,answer from note where id in ('+ idArray +')';
  db.query(sql,function(err,row){
     if(err)
       console.log("錯誤警告" + err);
     else {
       for(var i in row){
         question[i] = row[i].question;
         answer[i] = row[i].answer;
       }
       console.log(question);
       console.log(answer);
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
       var pdfOptions = {format: 'Letter'};

       pdf.create(html, pdfOptions).toFile('./note.pdf', function(err, result){
         if(err){
           console.log('error in pdf.create(), err=', err);
           res.send(err);
         }
         else{
           console.log('result=', result);
           res.setHeader('Content-Type', 'application/pdf');
           res.setHeader('Access-Control-Allow-Origin','*');
           res.download('./note.pdf');
         }
       });
     }
  })
});
//
// router.route('/pdf3')
//     .post(function (req,res,next) {
//       var db=req.connection;
//       var idArray= new Array();
//       var a=JSON.stringify(req.body);
//       var question=new Array();
//       var answer=new Array();
//       //var b=JSON.parse(a);
//       idArray=a.split('"');
//       for(var i in idArray)
//          idArray.splice(i,1);
//       for(var i in idArray)
//          idArray.splice(i,1);
//       console.log(a);
//       console.log(idArray);
//       var sql='SELECT question,answer from note where id in ('+ idArray +')';
//       db.query(sql,function(err,row){
//         if(err)
//           console.log("錯誤警告" + err);
//         else {
//           for(var i in row){
//             question[i] = row[i].question;
//             answer[i] = row[i].answer;
//           }
//           console.log(question);
//           console.log(answer);
//           //res.json(question+answer);
//           next();
//         }
//       });
//     })
//     .post(function(req,res,next){
//         var htmlStart = '<html><body>';
//         var htmlEnd = '</body></html>';
//
//         var htmlContent = '';
//         var num=1;
//         for(var i in question){
//           htmlContent += '<hr>'
//               + '<h3>' + num + '.&nbsp;' + question[i] + '</h3><p>';
//           console.log("問題: "+question[i]);
//           num += 1;
//         }
//         var html = htmlStart + htmlContent + htmlEnd;
//         console.log(html);
//         var pdfOptions = {format: 'Letter'};
//
//         pdf.create(html, pdfOptions).toFile('./note.pdf', function(err, result){
//           if(err){
//             console.log('error in pdf.create(), err=', err);
//             res.send(err);
//           }
//           else{
//             console.log('result=', result);
//             res.send('success');
//           }
//         });
//     });
// router.post('/pdf1',function (req,res,next) {
//   // var json = fs.readFileSync('C:\\Users\\user\\IdeaProjects\\note-server\\bookstore.json', 'utf8');
//   // var obj = JSON.parse(json);
//   var htmlStart = '<html><body>';
//   var htmlEnd = '</body></html>';
//
//   var htmlContent = '';
//   var num=1;
//   for(var i in question){
//     htmlContent += '<hr>'
//         + '<h3>' + num + '.&nbsp;' + question[i] + '</h3><p>';
//     console.log("問題: "+question[i]);
//     num += 1;
//   }
//   var html = htmlStart + htmlContent + htmlEnd;
//   console.log(html);
//   var pdfOptions = {format: 'Letter'};
//
//   pdf.create(html, pdfOptions).toFile('./note.pdf', function(err, result){
//     if(err){
//       console.log('error in pdf.create(), err=', err);
//       res.send(err);
//     }
//     else{
//       console.log('result=', result);
//       res.send('success');
//     }
//   });
// });

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

      pdf.create(html, pdfOptions).toFile('./note.pdf', function (err, result) {
        if (err) {
          console.log('error in pdf.create(), err=', err);
          res.send(err);
        } else {
          console.log('result=', result);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Access-Control-Allow-Origin','*');
          res.download('./note.pdf');
        }
      });
    }
  });
});
module.exports = router;
