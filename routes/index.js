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

//搜尋單筆筆記資料
router.post('/note',function(req,res){
    var db =req.connection;
    var id=req.body.id;
    var sql="select * from note where id = "+ id;
    var data = [];
    var data2 = [];
    db.query(sql,function(err,rows){
       if(err)
           console.log("發生錯誤: "+ err);
       else{
           data=rows;
           console.log(rows);
       }
    });
    var sql2="select name from label where id in(select label_id from mark where note_id ="+ id +")";
    db.query(sql2,function(err,rows) {
       if(err)
           console.log("標籤搜尋失敗: "+err);
       else{
           data2=rows;
           res.json({
               note_id:data[0].id,
               user_id:data[0].user_id,
               title:data[0].title,
               content:data[0].content,
               answer:{
                   picture:data[0].answer_pic,
                   text:data[0].answer
               },
               question:{
                   picture:data[0].question_pic,
                   text:data[0].question
               },
               label:data2
           });
       }
    });
});

async function selectnote(db,a){
    let test_array=new Array();
    let sql="select * from note where id= "+ a;
    await new Promise((resolve)=> {
        db.query(sql, function (err, rows) {
            test_array = rows;
            console.log("474: " + rows);
            console.log("474: " + test_array);
            resolve(1);
        });
    });
    //test_array=[{科目:"國文"},{科目:"英文"},{科目:"數學"},{科目:"社會"},{科目:"自然"}];
    console.log(test_array);
    return test_array;
}
async function test(){
    let test_array=new Array();
    // test_array=["國文","英文","數學","社會","自然"];
    for(let i=0;i<5;i++)
        test_array[i]=i;
    console.log(test_array);
    test_array.splice(2,1);
    console.log(test_array);
    return test_array;
}
router.get('/test/:id',async function(req,res){
    var db=req.connection;
    var id=req.params.id;
    let result = new Array();
    result = await test();
    console.log(result);
    res.json(result);
});
//筆記搜尋
router.post('/note/select',async function(req,res) {
   let db=req.connection;
   let st_word=req.body.word;
   let user_id=req.body.userid;
   let word1=new Array();
   let word2=new Array();
   word1=await select_note(db,st_word,user_id);
   word2=await select1_label(db,st_word,user_id);
   console.log("word1: "+word1);
   console.log("word2: "+word2);
   for(let i = 0; i < word1.length; i++){
       for(let j = 0; j < word2.length; j++){
           if(word1[i]==word2[j]){
               word2.splice(0,1);
           }
       }
   }
   for(let j = 0; j < word2.length; j++)
       word1.push(word2[j]);
   let a=await select_result(db,word1);
   res.json(a);
});
async function select_note(db,word,id){
    let note_result = new Array();
    let count = 0;
    let sql="SELECT id FROM note WHERE user_id="+id+" AND(title like "+"'%"+word+"%'"+" or answer like "+"'%"+word+"%'"+" or question like "+"'%"+word+"%')";
    await new Promise((resolve)=> {
        db.query(sql, function (err, rows) {
            if (err)
                console.log("114: " + err);
            else {
                console.log("搜尋成功");
                for(let i in rows){
                    note_result[count] = rows[count].id;
                    count++;
                }
                resolve(1);
            }
        });
    });
    console.log("144: "+ note_result[0]);
    return note_result;
}
async function select1_label(db,word,id){
    let note_id = new Array();
    let note_result = [];
    let count = 0;
    let count1= 0;
    let sql1="SELECT note_id FROM mark WHERE label_id in (SELECT id FROM label WHERE name like "+"'%" +word+"%')";
    await new Promise((resolve)=> {
        db.query(sql1, function (err, rows) {
            if (err)
                console.log("114: " + err);
            else {
                console.log("搜尋成功");
                for (let i in rows) {
                    note_id[count] = rows[count].note_id;
                    count++;
                }
                resolve(1);
            }
        });
    });
    console.log("167: "+ note_id);
    let sql2="SELECT id FROM note WHERE user_id ="+ id +" AND id in("+ note_id+")";
    await new Promise((resolve)=> {
        db.query(sql2, function (err, rows) {
            if (err)
                console.log("157: " + err);
            else {
                console.log("搜尋成功");
                for(let i in rows){
                    note_result[count1]=rows[count1].id;
                    count1++;
                }
                resolve(1);
            }
        });
    });
    console.log("189: "+note_result);
    return note_result;
}
async function select_result(db,note_id){
    let data1=[];
    let note_data=[];
    data1["main"]={};
    let sql="SELECT * FROM note WHERE id in("+note_id+")";
    let count2=0;
    console.log(note_id);
    await new Promise((resolve)=> {
      db.query(sql,function(err,rows) {
        if(err)
            console.log("162: "+err);
        else{
           note_data=rows;
           resolve(1);
        }
      });
    });
    console.log(note_data);
    await new Promise((resolve)=>{
        for(let a=0;a<note_data.length;a++){
            // var sql=[];
            // sql[a]={
            //     note_id:note_id[a]
            // };
            var sql={
                   note_id:note_id[a]
            };
            let sql2="select * from label where id in(select label_id from mark where ?)";
            console.log(sql);
            db.query(sql2,sql,function(err,rows) {
                if(err)
                    console.log("171: "+err);
                else{
                    let tag=new Array();
                    for(let b=0;b<rows.length;b++){
                        tag[b]=rows[b].name;
                    }
                    console.log(tag);
                    let labelname=note_data[a].id;
                    console.log(note_data[a].id);
                    data1["main"][labelname];
                    data1["main"][labelname]= {
                        "id": note_data[a].id,
                        "title": note_data[a].title,
                        "content": note_data[a].content,
                        "question_pic": note_data[a].question_pic,
                        "tag": tag
                    };
                    console.log(data1["main"]);
                    if(a==note_data.length-1)
                        resolve(1);
                }
            });
        }
    });
    return(data1["main"]);
}
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
  db.query('UPDATE user SET ? WHERE account = ?', [sql, account], function(err, rows) {
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
  db.query('UPDATE user SET ? WHERE account = ?', [sql,account], function(err, rows) {
    if (err) {
      console.log(err);
      res.end('修改失敗');
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(time);
    // res.redirect('/');
  });
});


async function select_label(db,label)
{
    var answer;
    var sql1="SELECT id FROM label WHERE name ='" + label.name +"'";
    console.log("1: " + label.name);
    await new Promise((resolve)=>{
        db.query(sql1,function(err,row){
            if(err)
                resolve("標籤搜尋失敗:"+ err);
            else{
                if(row[0] != null){
                    answer = row[0].id;
                    console.log("2: "+ row[0].id);
                    resolve(answer);
                }
                else{
                   let sql2 ={
                       id:label.user_id,
                       name:label.name,
                       level:label.level
                   };
                    console.log("3: "+sql2);
                   db.query("INSERT INTO label SET ?",sql2,function(err2,row2){
                       if(err2)
                         console.log("標籤添加失敗: "+ err2);
                       else{
                           answer = row2.insertId;
                           console.log("4" + row2.insertId);
                           resolve(answer);
                       }
                   });
                }
            }
        });
    });
    console.log("5:"+ answer);
    return answer;
}
async function update_mark(db,label,id)
{
    var new_length = label.length;
    var old_length;
    var count = 0;
    var oldid = new Array();
    var sql="SELECT * FROM mark WHERE note_id =" + id;
    await new Promise((resolve)=>{
        console.log(1);
        db.query(sql,function(err,rows){
            if(err)
                console.log("分類搜尋失敗: " + err);
            else{
                for(var i in rows)
                    oldid[i] = rows[i].id;
                old_length=rows.length;
                resolve(old_length);
            }
        });
    });
    await new Promise((resolve)=>{
       if(old_length > new_length)
       {
           console.log(2);
           let a = old_length-new_length;
           for(var i = 0; i < a; i++){
               let sql2=" DELETE FROM mark WHERE id = " + oldid[i];
               console.log(sql2);
               db.query(sql2,function(err1,row1){
                   if(err1)
                       console.log("分類刪除失敗: " + err1);
                   else{
                       console.log("分類刪除成功");
                   }
               });
           }
           let sql3="SELECT id FROM mark WHERE note_id =" + id;
           db.query(sql3,function(err2,row2) {
               if(err2)
                   console.log("分類二次搜尋失敗"+ err2);
               else{
                   for(var i in row2)
                   {
                       let sql4 = "UPDATE mark SET label_id = "+ label[i] +" WHERE id = " + row2[i].id;
                       db.query(sql4,function(err3,rows3) {
                           if(err3)
                               console.log("更新失敗: "+ err3);
                           else
                               console.log("更新成功");
                           resolve(0);
                       });
                   }
               }
           });
       }
       else if(old_length < new_length)
       {
           console.log(3);
          let a = new_length - old_length;
          let sql2 = "SELECT id FROM mark WHERE note_id =" + id;
          db.query(sql2,function(err,rows) {
              if(err)
                  console.log("分類二次搜尋失敗: " + err);
              else{
                  for(let i=0;i<old_length;i++){
                      console.log(count);
                      let sql3 = "UPDATE mark SET label_id = "+ label[i] +" WHERE id = " + rows[i].id;
                      db.query(sql3,function(err2,rows2) {
                         if(err2)
                             console.log("分類更新失敗: " + err2);
                         else
                             console.log("分類更新成功");
                      });
                      count++;
                  }
              }
          });
          for(let i=0; i < a ;i++){
              console.log(count);
              let sql4={
                  label_id:label[count],
                  note_id:id
              };
              db.query("INSERT INTO mark SET ?",sql4,function(err,rows) {
                 if(err)
                     console.log("新增分類失敗: " + err);
                 else{
                     console.log("新增分類成功");
                     resolve(0);
                 }
              });
              count++;
          }
       }
       else if(old_length == new_length){
           console.log(4);
           let sql2 = "SELECT id FROM mark WHERE note_id =" + id;
           db.query(sql2,function(err,rows) {
               console.log(522);
               if(err)
                   console.log("分類二次搜尋失敗: " + err);
               else{
                   console.log(526);
                   for(let i=0; i < old_length ;i++){
                       let sql3 = "UPDATE mark SET label_id = "+ label[i] +" WHERE id = " + rows[i].id;
                       console.log(sql3);
                       db.query(sql3,function(err2,rows2) {
                           console.log(529);
                           if(err2)
                               console.log("更新分類失敗: " + err2);
                           else{
                               console.log("更新分類成功");
                               resolve(0);
                           }
                       });
                   }
               }
           });
       }
    });
    return "success";
}

async function update_relation(db,labelArray,id){
    var old_rela;
    var new_rela = (labelArray.length) - 1;
    var oldid = new Array();
    var count = 0;
    console.log("天啊: "+labelArray[0].id);
    var sql="SELECT * FROM label_relation WHERE note_id = " + id;
    await new Promise((resolve)=> {
        console.log(1);
        db.query(sql, function (err, rows) {
            if (err) {
                console.log("搜尋標籤關係失敗: " + err);
                resolve(1);
            }
            else{
                for(let i in rows)
                    oldid[i] = rows[i].id;
                old_rela = rows.length;
                resolve(0);
            }
        });
    });
    console.log(new_rela);
    console.log(old_rela);
    await new Promise((resolve)=>{
        if(old_rela > new_rela)
        {
            console.log(2);
            let a = old_rela-new_rela;
            for(let i = 0; i < a; i++){
                let sql2=" DELETE FROM label_relation WHERE id = " + oldid[i];
                db.query(sql2,function(err,row){
                    if(err)
                        console.log("標籤關係刪除失敗: " + err);
                    else{
                        console.log("標籤關係刪除成功");
                    }
                });
            }
            let sql3="SELECT id FROM label_relation WHERE note_id =" + id;
            db.query(sql3,function(err2,row2) {
                if(err2)
                    console.log("標籤關係二次搜尋失敗"+ err2);
                else{
                    for(let i=0;i<row2.length;i++)
                    {
                        let sql4 = "UPDATE label_relation SET ?  WHERE id = " + row2[i].id;
                        let sql4data={
                          child_id:labelArray[i+1].id,
                          child_name:labelArray[i+1].name,
                          father_id:labelArray[i].id,
                          father_name:labelArray[i].name,
                        };
                        db.query(sql4,sql4data,function(err3,rows3) {
                            if(err3) {
                                console.log("標籤關係更新失敗: " + err3);
                                resolve(1);
                            }
                            else {
                                console.log("標籤關係更新成功");
                                resolve(0);
                            }
                        });
                    }
                }
            });
        }
        else if(old_rela < new_rela)
        {
            console.log(3);
            let a = new_rela - old_rela;
            let sql2 = "SELECT id FROM label_relation WHERE note_id =" + id;
            db.query(sql2,function(err,rows) {
                if(err)
                    console.log("標籤關係二次搜尋失敗: " + err);
                else{
                    for(let i=0;i<rows.length;i++){
                        console.log("關係count: "+ count);
                        console.log("關係 i: "+ i);
                        let x= i + 1;
                        console.log("哈哈:  " + labelArray[i+1].id);
                        let sql3 = "UPDATE label_relation SET ? WHERE id = " + rows[i].id;
                        console.log(sql3);
                        let sql3data = {
                            child_id:labelArray[i+1].id,
                            child_name:labelArray[i+1].name,
                            father_id:labelArray[i].id,
                            father_name:labelArray[i].name,
                        };
                        db.query(sql3,sql3data,function(err2,rows2) {
                            if(err2)
                                console.log("標籤關係更新失敗: " + err2);
                            else
                                console.log("標籤關係更新成功");
                        });
                        count++;
                    }
                    for(let i=0; i < a ;i++){
                        console.log("關係count2: "+ count);
                        console.log("關係 i2: "+ i);
                        let sql4={
                            child_id:labelArray[count+1].id,
                            child_name:labelArray[count+1].name,
                            father_id:labelArray[count].id,
                            father_name:labelArray[count].name,
                            note_id:id
                        };
                        db.query("INSERT INTO label_relation SET ?",sql4,function(err,rows) {
                            if(err) {
                                console.log("新增標籤關係失敗: " + err);
                                resolve(1);
                            }
                            else{
                                console.log("新增標籤關係成功");
                                resolve(0);
                            }
                        });
                        count++;
                    }
                }
            });
        }
        else if(old_rela == new_rela){
            console.log(4);
            let sql2 = "SELECT id FROM label_relation WHERE note_id =" + id;
            db.query(sql2,function(err,rows) {
                console.log(670);
                if(err)
                    console.log("標籤關係二次搜尋失敗: " + err);
                else{
                    console.log(674);
                    for(let i=0; i < old_rela ;i++){
                        let sql3 = "UPDATE label_relation SET ? WHERE id = " + rows[i].id;
                        let sql3data = {
                            child_id:labelArray[i+1].id,
                            child_name:labelArray[i+1].name,
                            father_id:labelArray[i].id,
                            father_name:labelArray[i].name,
                        };
                        console.log(sql3);
                        db.query(sql3,sql3data,function(err2,rows2) {
                            console.log(529);
                            if(err2){
                                console.log("更新標籤關係失敗: " + err2);
                                resolve(1);
                            }
                            else{
                                console.log("更新標籤關係成功");
                                resolve(0);
                            }
                        });
                    }
                }
            });
        }
    });
 return "success";
}

//修改筆記
router.post('/update/note/:id',async function(req, res) {
  var db=req.connection;
  var id = req.params.id;
  var label_id=new Array();
  var sql = {
    title:req.body.title,
    content:req.body.content,
    question:req.body.question.text,
    answer:req.body.answer.text
  };
  for(var i in req.body.label){
      console.log("label計數: "+i);
      let label={
          user_id:req.body.user_id,
          name:req.body.label[i].name,
          lavel:req.body.label[i].level
      };
      label_id[i] = await select_label(db,label);
  }
  console.log(label_id);
  await update_mark(db,label_id,id);
  let labelArray=new Array();
  for(let i in label_id){
      let labeldata={
          id:label_id[i],
          name:req.body.label[i].name,
          level:req.body.label[i].level
      };
      labelArray[i]=labeldata;
  }
  console.log(labelArray);
  await update_relation(db,labelArray,id);
  db.query('UPDATE note SET ? WHERE id = ?', [sql, id], function(err, rows) {
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
  var sql1='DELETE FROM  label_relation WHERE note_id =' + id;
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