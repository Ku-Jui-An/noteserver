# database
資料庫操作
從外部連線的話請將連接資訊修改成下面這段程式

var connection = mysql.createConnection({

  host     : '35.213.23.117',
  
  port     : '3306',
  
  user     : 'Andrew',
  
  password : 'Andrew93220@',
  
  database : 'Notebook'

});

資料表有 user,note,label,mark

執行時用cmd進入專案資料夾，輸入指令npm start，便會自動執行nodemon app。

搜尋 api  (GET)

http://35.213.23.117:3000/routes/select/(輸入欲搜尋的表單)

透過帳號搜尋出使用者(GET)

http://35.213.23.117:3000/routes/single/(輸入帳號)

透過 uid 搜尋出使用者 id 和 name(GET)

http://35.213.23.117:3000/routes/uid/(輸入uid)

每次搜尋十筆筆記(GET)

http://35.213.23.117:3000/routes/note/(使用者id)/(第幾筆開始搜尋)

ex: http://35.213.23.117:3000/routes/note/91/0  找出第一筆到第十筆資料

        (傳到前端的json格式 { max: 總筆數,
                             
                             data:[
                             
                             {
                                    user_id: int, 
                                        
                                    title: varchar,      (可為空值)
                                        
                                    content: varchar,
                                        
                                    picture1: varchar,   (可為空值)
                                       
                                    picture2: varchar,   (可為空值)
        
                                    picture3: varchar,   (可為空值)
        
                                    answer: varchar,     (可為空值)
        
                                    question: varchar    (可為空值)
                             }
                             
                           ]

新增使用者  (POST)

http://35.213.23.117:3000/routes/plus/user?name=(輸入名子)&account=(輸入帳號)&password=(輸入密碼)&platform=(輸入平台)&uid=(輸入uid)

新增筆記  (POST)

http://35.213.23.117:3000/routes/plus/note?user_id=(輸入id)&title=(輸入標題)&picture=(輸入位址)&content=(輸入內容)

新增筆記(接收json) (POST)

http://35.213.23.117:3000/routes/plus/note2    
                                    
                    (傳到後端的json格式 {user_id:"資料", 
                                        
                                        title:"資料", 
                                        
                                        content:"資料",
                                        
                                        picture1:" ",   (可為空值)
                                       
                                        picture2:" ",   (可為空值)
        
                                        picture3:" ",   (可為空值)
        
                                        answer:" ",     (可為空值)
        
                                        question:" "    (可為空值)
                                        
                                        })

新增標籤  (POST)

http://35.213.23.117:3000/routes/plus/label?type=(輸入類別)&name=(標籤名稱)

新增標籤與筆記關係  (POST)

http://35.213.23.117:3000/routes/plus/mark?label_id=(標籤id)&note_id=(筆記id)

修改使用者  (POST)

http://35.213.23.117:3000/routes/update/user/(輸入修改id)?name=(輸入名子)&account=(輸入帳號)&password=(輸入密碼)&platform=(輸入平台)

修改筆記  (POST)

http://35.213.23.117:3000/routes/update/note/(輸入修改id)  

           (傳到後端的json格式  { title:"資料",
           
                                content:"資料",
                                
                                picture1:" ",   (可為空值)
                                       
                                picture2:" ",   (可為空值)
        
                                picture3:" ",   (可為空值)
        
                                answer:" ",     (可為空值)
        
                                question:" "    (可為空值)
                                
                                })

修改標籤  (POST)

http://35.213.23.117:3000/routes/update/label/(輸入修改id)?type=(輸入類別)&name=(標籤名稱)

修改標籤與筆記關係  (POST)

http://35.213.23.117:3000/routes/update/mark/(輸入修改id)?label_id=(標籤id)&note_id=(筆記id)

透過帳號修改密碼api  (post)

http://35.213.23.117:3000/routes/update/useracc/輸入帳號?password=(新密碼)

修改最後登入時間api  (post)

http://35.213.23.117:3000/routes/update/usertime/輸入帳號

刪除api  (GET)  (新增刪除關聯功能  ex:刪除 user id = 1 時，連同note,mark也會一起刪除)

筆記

http://35.213.23.117:3000/routes/delete/note/(輸入刪除id)

使用者

http://35.213.23.117:3000/routes/delete/user/(輸入刪除id)

標籤

http://35.213.23.117:3000/routes/delete/label/(輸入刪除id)

標籤與筆記關係

http://35.213.23.117:3000/routes/delete/mark/(輸入刪除id)

PDF功能 (Post)

   傳筆記 id 給 api，回傳 pdf 的 base64。
   
   http://35.213.23.117:3000/users/pdf2
     
        json格式           {
        
                             "notedata":[
                             
                                  { "id" : 5 },
                                  
                                  { "id" : 3 }
                                  
                                ]
                                
                            };
                            
        若不沒按照上面格式傳會出錯。

