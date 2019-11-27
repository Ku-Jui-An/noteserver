var express = require('express');
var router = express.Router();
var sd = require('silly-datetime');
var fs = require('fs');
var path = require('path');
//-------------------------------------------搜尋------------------------------------------------------
//:note 輸入欲搜尋的表單
router.get('/select/:note',function(request,response,next){
  var db=request.connection;
  var data = [];
  var field=request.params.note;
  var sql='select * from '+ field;
  db.query(sql, function(err, rows) {
    if (err) {
      console.log(err);
      response.end('搜尋失敗');
    }
    else{
      data=rows;
      response.json(data);
    }
  });
});

//透過帳號搜尋出使用者
router.get('/single/:account',function(request,response,next){
  var db=request.connection;
  var data = [];
  var sql={
    account:request.params.account
  };
  db.query('SELECT id,name,account,password,platform FROM user WHERE ?',sql, function(err, rows) {
    if (err) {
      console.log(err);
      response.end('搜尋失敗');
    }
    else{
      data=rows;
      response.json(data);
    }
  });
});

//透過uid搜尋出使用者
router.get('/uid/:uid',function(request,response,next){
  var db=request.connection;
  var data = [];
  var sql={
    uid:request.params.uid
  };
// var acc=request.query.account;
  db.query('SELECT id,name,account FROM user WHERE ?',sql, function(err, rows) {
    if (err) {
      console.log(err);
      response.end('搜尋失敗');
    }
    else {
      data=rows;
      response.json(data);
    }
  });
});

//搜尋十筆資料
router.get('/note/:user_id/:floor',function(request,response){
  var db = request.connection;
  //每次搜尋十筆
  var range = 10;
  //從哪一筆開始搜尋
  var floor = request.params.floor;
  //存放資料
  var data = new Array(10);
  //最大筆數
  var max = 0;
  //搜尋十筆資料
  var sql2 = 'Select * From note where user_id=' + request.params.user_id + ' ORDER BY id DESC Limit ' + floor + ',' + range;
  //搜尋使用者最大筆數
  var sql='SELECT COUNT(*) as total FROM note where user_id = '+ request.params.user_id;


  db.query(sql,function(err, rows) {
    if(err){
      console.log(err);
      response.end('搜尋失敗');
    }
    else{
      max = rows[0].total;
      db.query(sql2,function (err,rows) {
        if(err){
          console.log(err);
          response.end('搜尋失敗');
        }
        else{
          data=rows;
          response.json({
            max : max,
            data: data
          });
        }
      });
    }
  });
});

//-------------------------------------------新增------------------------------------------------------

//新增使用者
router.post('/plus/user',function(req,res,next){
  var db=req.connection;
  var sql = {
    name:req.query.name,
    account:req.query.account,
    password:req.query.password,
    platform:req.query.platform,
    uid:req.query.uid
  };
  db.query('INSERT INTO user SET ?',sql,function(error,results,fields){
    if(error){
      res.end('添加失败:'+error);
    }
    else {
      res.setHeader('Content-Type', 'application/json');
      res.json(sql);
    }
  });
});

//新增筆記
router.post('/plus/note',function(req,res,next){
  var db=req.connection;

  var sql = {
    user_id:req.query.user_id,
    title:req.query.title,
    content:req.query.content,
    picture1:req.query.picture1,
    picture2:req.query.picture2,
    picture3:req.query.picture3,
    answer:req.query.answer,
    question:req.query.question
  };
  db.query('INSERT INTO note SET ?',sql,function(error,results,fields){
    if(error){
      res.end('添加失败:'+error);
    }
    else
    {
      res.setHeader('Content-Type', 'application/json');
      res.send('添加成功:'+req.query.title);
    }
  });
});
router.post('/test',function(req,res){
   uploads(req.body.answer.picture,res);
});

//新增筆記2
router.post('/plus/note2',function(req,res,next){
  var db = req.connection;
  var id_Array = new Array();
  var noteid;
  var count=0;
  var count2=0;
  var sql = {
    user_id:req.body.user_id,
    title:req.body.title,
    answer_pic:req.body.answer.picture,
    question_pic:req.body.question.picture,
    answer:req.body.answer.text,
    question:req.body.question.text,
    content:req.body.content,
  };
  //新增筆記內容
  db.query('INSERT INTO note SET ?',sql,function(error,results,fields){
    if(error){
      res.end('筆記添加失败:'+error);
    }
    else
    {
      noteid = results.insertId;
      console.log(noteid);
      for(var i in req.body.label){
          var sql="SELECT id FROM label WHERE name = '"+req.body.label[i].name +"'";
          console.log(sql);
          var x;
          db.query(sql,function(err,rows) {
              if(err){
                  console.log(err)
              }
              else{
                  console.log(rows);
                  if(rows[0] != null)
                      x=new Boolean(true);
                  else
                      x = new Boolean(false);
                  if(x==false){
                      console.log('我是if ' + count );
                      var label_sql={
                          name:req.body.label[count].name,
                          level:req.body.label[count].level,
                          user_id:req.body.user_id
                      };
                      console.log(label_sql);
                      db.query('INSERT INTO label SET ?',label_sql,function(error,results){
                          if(error){
                              res.end('自訂標籤添加失败:'+error);
                          }
                          else {
                              var newlabel_id=results.insertId;
                              console.log('自訂標籤成功');
                              var mark_insert = {
                                  label_id: newlabel_id,
                                  note_id: noteid
                              };
                              console.log(mark_insert);
                              console.log("開始relation "+ count2);
                              id_Array[count2]=newlabel_id;
                              var label_relationship={
                                  note_id:noteid,
                                  child_id:newlabel_id,
                                  child_name:req.body.label[count2].name,
                                  father_id:id_Array[count2-1],
                                  father_name:req.body.label[count2-1].name
                              };
                              console.log(label_relationship);
                              count2+=1;
                              db.query('INSERT INTO label_relation SET ?',label_relationship,function(err,row) {
                                  if(err) {
                                      res.end('標籤關係添加失败:'+err);
                                  }
                                  else {
                                      console.log("標籤關係新增成功")
                                  }
                              });
                              db.query('INSERT INTO mark SET ?', mark_insert, function (err, row) {
                                  if (err) {
                                      res.end('mark添加失败:' + err);
                                  } else {
                                      console.log("mark新增成功");
                                  }
                              });
                          }
                      });
                      count+=1;
                  }
                  else {
                      console.log('我是else ' + count);
                      id_Array[count] = rows[0].id;
                      var mark_insert = {
                          label_id: rows[0].id,
                          note_id: noteid
                      };
                      console.log(mark_insert);
                      console.log("level: " + req.body.label[count].level);
                      if(req.body.label[count].level>=2){
                          var label_relationship = {
                              note_id: noteid,
                              child_id: id_Array[count],
                              child_name: req.body.label[count].name,
                              father_id: id_Array[count-1],
                              father_name: req.body.label[count - 1].name
                          };
                          console.log(label_relationship);
                          db.query('INSERT INTO label_relation SET ?', label_relationship, function (err, row) {
                              if (err) {
                                  res.end('標籤關係添加失败:' + err);
                              } else {
                                  console.log("標籤關係新增成功")
                              }
                          });
                      }
                      db.query('INSERT INTO mark SET ?', mark_insert, function (err, row) {
                          if (err) {
                              res.end('mark添加失败:' + err);
                          } else {
                              console.log("mark新增成功");
                          }
                      });
                      count += 1;
                      count2 += 1;
                  }
              }
          });
      }
    }
      res.json(noteid);
  });

});


//新增標籤
router.post('/plus/label',function(req,res,next){
  var db=req.connection;

  var sql = {
    name:req.body.name,
    level:req.body.level,
    user_id:1
  };
  db.query('INSERT INTO label SET ?',sql,function(error,results,fields){
    if(error){
      res.end('添加失败:'+error);
    }
    else
    {
      res.setHeader('Content-Type', 'application/json');
      console.log(results);
      console.log(results.insertId);
      res.send(results);
    }
  });
});

//新增關聯
router.post('/plus/mark',function(req,res,next){
  var db=req.connection;

  var sql = {
    label_id:req.query.label_id,
    note_id:req.query.note_id,
    user_id:req.query.user_id
  };
  db.query('INSERT INTO mark SET ?',sql,function(error,results,fields){
    if(error){
      res.end('添加失败:'+error);
    }
    else
    {
      res.setHeader('Content-Type', 'application/json');
      res.send('添加成功:'+ req.query.note_id);
    }
  });
});

//-------------------------------------------修改------------------------------------------------------

//修改使用者
router.post('/update/user/:id', function(req, res, next) {
  var db=req.connection;
  var id = req.params.id;

  var sql = {
    name:req.query.name,
    account:req.query.account,
    password:req.query.password,
    platform:req.query.platform
  };
  var qur = db.query('UPDATE user SET ? WHERE id = ?', [sql, id], function(err, rows) {
    if (err) {
      console.log(err);
      res.end('修改失敗');
    }

    res.setHeader('Content-Type', 'application/json');
    res.send('修改成功');
    // res.redirect('/');
  });
});

//帳號修改密碼
router.post('/update/useracc/:account', function(req, res, next) {
  var db=req.connection;
  var account = req.params.account;

  var sql = {
    password:req.body.password
  };
  var qur = db.query('UPDATE user SET ? WHERE account = ?', [sql, account], function(err, rows) {
    if (err) {
      console.log(err);
      res.end(sql);
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(sql);
    // res.redirect('/');
  });
});

//最後登入時間
router.post('/update/usertime/:account', function(req, res, next) {

  var db=req.connection;
  var account = req.params.account;
  var time=sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
  var sql={
    time:time
  };
  var qur = db.query('UPDATE user SET ? WHERE account = ?', [sql,account], function(err, rows) {
    if (err) {
      console.log(err);
      res.end('修改失敗');
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(time);
    // res.redirect('/');
  });
});

//修改筆記
router.post('/update/note/:id', function(req, res, next) {

  var db=req.connection;
  var id = req.params.id;

  var sql = {
    title:req.body.title,
    content:req.body.content,
    picture1:req.body.picture1,
    picture2:req.body.picture2,
    picture3:req.body.picture3,
    answer:req.body.answer,
    question:req.body.question
  };
  var qur = db.query('UPDATE note SET ? WHERE id = ?', [sql, id], function(err, rows) {
    if (err) {
      console.log(err);
      res.end('修改失敗');
    }

    res.setHeader('Content-Type', 'application/json');
    res.send('修改成功');
    // res.redirect('/');
  });

});

//修改標籤
router.post('/update/label/:id', function(req, res, next) {

  var db=req.connection;
  var id = req.params.id;

  var sql = {
    type:req.query.type,
    name:req.query.name,
  };
  var qur = db.query('UPDATE label SET ? WHERE id = ?', [sql, id], function(err, rows) {
    if (err) {
      console.log(err);
      res.end('修改失敗');
    }

    res.setHeader('Content-Type', 'application/json');
    res.send('修改成功');
    // res.redirect('/');
  });
});

//修改關聯
router.post('/update/mark/:id', function(req, res, next) {

  var db=req.connection;
  var id = req.params.id;

  var sql = {
    label_id:req.query.label_id,
    note_id:req.query.note_id
  };
  var qur = db.query('UPDATE mark SET ? WHERE id = ?', [sql, id], function(err, rows) {
    if (err) {
      console.log(err);
      res.end('修改失敗');
    }

    res.setHeader('Content-Type', 'application/json');
    res.send('修改成功');
    // res.redirect('/');
  });
});

//-------------------------------------------刪除------------------------------------------------------

//刪除筆記

router.get('/delete/note/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.connection;
  var sql1 = 'DELETE FROM  label_relation WHERE note_id =' + id;
  var sql2 = 'DELETE FROM  mark  WHERE note_id = ' + id;
  var sql3 = 'DELETE FROM  note  WHERE id = ' + id;
  db.query(sql1, function(err, rows) {
    if(err){
      console.log("刪除標籤關係失敗"+err);
      res.end('刪除失敗')
    }
    else{
      db.query(sql2, function(err,rows){
        if (err) {
          console.log("刪除MARK失敗"+err);
          res.end('刪除失敗');
        }
        else{
          db.query(sql3,function(err,rows) {
            if (err) {
              console.log("刪除筆記失敗" + err);
              res.end('刪除失敗');
            }
            else{
              res.send('刪除成功');
            }
          });
        }
      });
    }
  });
});

router.get('/delete/user/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.connection;
  var sql1='DELETE FROM  label_relation WHERE child_id IN (SELECT label_id FROM mark WHERE note_id IN (SELECT id FROM note WHERE user_id='+ id +')) OR father_id IN ( SELECT label_id FROM mark WHERE note_id IN (SELECT id FROM note WHERE user_id='+ id +')';
  var sql3='DELETE FROM note WHERE user_id =' + id;
  var sql4='DELETE FROM user WHERE id = ' + id;
  var sql2='DELETE FROM mark WHERE note_id IN (SELECT id FROM note WHERE user_id='+ id +')';
  db.query(sql1,function(err,rows){
    db.query(sql2, function(err, rows) {
      db.query(sql3, function(err, rows) {
        db.query(sql4, function(err, rows) {
          if (err) {
            console.log(err);
            res.end('刪除失敗');
          }
            res.send("刪除成功");
        });
      });
    });
  });
});

router.get('/delete/label/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.connection;
  var sql1 = 'DELETE FROM  mark  WHERE label_id = ' + id
  var sql2 = 'DELETE FROM  label  WHERE id = ' + id
  db.query(sql1, function(err, rows) {

    db.query(sql2, function(err,rows){
      if (err) {
        console.log(err);
        res.end('刪除失敗');
      }
      res.send('刪除成功');
    });

    // res.redirect('/');
  });
});

router.get('/delete/mark/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.connection;
  var sql1 = 'DELETE FROM  mark  WHERE id = ' + id
  db.query(sql1, function(err, rows) {


    if (err) {
      console.log(err);
      res.end('刪除失敗');
    }
    res.send('刪除成功');

    // res.redirect('/');
  });
});

router.get('/delete/labelre/:id', function(req, res, next) {
  var id = req.params.id;
  var db = req.connection;
  var sql1 = 'DELETE FROM  label_relation  WHERE id = ' + id
  db.query(sql1, function(err, rows) {
    if (err) {
      console.log(err);
      res.end('刪除失敗');
    }
    res.send('刪除成功');

    // res.redirect('/');
  });
});
module.exports = router;