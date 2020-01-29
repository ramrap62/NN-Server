const Express = require("express");
const BodyParser = require("body-parser");
const Mongoose = require("mongoose");
const Bcrypt = require("bcryptjs");
const path = require('path');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var browser=require('webdriverio');
var app = Express();
var nodemailer = require("nodemailer");
var name,to,subject,text;
var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure:true,
    auth: {
        user: "nn.extension@gmail.com",
        pass: "Tenedun@12345"
    }
});
app.use(cookieParser());

app.use(flash());


app.use('/css',Express.static(__dirname +'/Login_v4/Login_v4/css'));
app.use('/images',Express.static(__dirname +'/Login_v4/Login_v4/images'));

app.use('/vendor',Express.static(__dirname +'/Login_v4/Login_v4/vendor'));

app.use('/fonts',Express.static(__dirname +'/Login_v4/Login_v4/fonts'));

app.use(Express.static(path.join(__dirname, '/Login_v4/Login_v4')));


 

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extend: true }));

Mongoose.connect("mongodb://localhost/real-testing",{ useNewUrlParser: true });



const UserSchema = new Mongoose.Schema({
    username: String,
    email:String,
    password: String,
    loggedin:false
});

UserSchema.pre("save", function(next) {
    if(!this.isModified("password")) {
        return next();
    }
    this.password = Bcrypt.hashSync(this.password, 10);
    next();
});


UserSchema.methods.comparePassword = function(plaintext, callback) {
    return callback(null, Bcrypt.compareSync(plaintext, this.password));
};

const UserModel = new Mongoose.model("user", UserSchema);

app.post("/register", async (request, response) => {
    
    try {
       
        var user = new UserModel(request.body);
        var already = await UserModel.findOne({ email: request.body.email }).exec();
        if(!already) {
             var result = await user.save();
        
         
        rand=Math.floor((Math.random() * 100) + 54);
        host=request.get('host');
        link="http://"+request.get('host')+"/verify?id="+rand;
        mailOptions={
            to : request.body.email,
            subject : "Please confirm your Email account",
            html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
        }
        console.log(mailOptions);
        smtpTransport.sendMail(mailOptions, function(error, response){
         if(error){
                console.log(error);
            res.end("error");
         }else{
                console.log("Message sent: " + response.message);
            res.end("sent");
             }
         });
    
        return response.sendFile(__dirname+'/Login_v4/Login_v4/email-ver.html');
        }else{
             
            response.send("Email already exits");

        }
      }catch (error) {
        response.status(500).send(error);
    }
      
        //response.sendFile(__dirname+'/public/email.html');
    }); 

   

app.post("/login", async (request, response) => {
    try {
        var user = await UserModel.findOne({ email: request.body.email }).exec();
        if(!user) {
            return response.status(400).send({message:"The email does not exist"});
        }
        user.comparePassword(request.body.password, (error, match) => {
            try{
            if(!match) {
                return response.status(400).send("<h1>Invalid password</h1>");
            }
        
        }catch (error) {
            response.status(500).send(error);
        }
        
        if(match && user){
        UserModel.findOne({email: request.body.email}, function(err, user){
            if(err)return ("err");
            user.loggedin = true;
            user.save(function(err){
               if(err)return ("err");
               //user has been updated
             });

            response.cookie('email', request.body.email,{domain:"",maxAge:365 * 24 * 60 * 60 * 1000,httpOnly: false }); //Sets name = express
             console.log(request.cookies['email']);
           response.cookie('login', true, {domain:"",maxAge:365 * 24 * 60 * 60 * 1000,httpOnly: false });
           console.log(request.cookies['login']);
            return response.sendFile(__dirname+'/Login_v4/Login_v4/dashboard.html');
           });
        }
    });
    } catch (error) {
        response.status(500).send(error);
    }
});
app.post("/logout", async (request, response)=> {
    
           
   UserModel.findOne({email: request.cookies['email']}, function(err, user){
        if(err)return ("err");
        user.loggedin = false;
        
        user.save(function(err){
           if(err)return ("err");
           //user has been updated
           response.cookie('login', false, {maxAge:365 * 24 * 60 * 60 * 1000,httpOnly: false });
           
           print();
          }); 
          function print(){
         //response.cookie('ad-block-email', request.body.email,{maxAge:365 * 24 * 60 * 60 * 1000,httpOnly: false }); //Sets name = express
           console.log(request.cookies['email']);
           
           console.log(request.cookies['login']);
         //response.sendFile(__dirname+'/Login_v4/Login_v4/login.html');
          }
                     
    });     

});

app.get('/verify',async(request,response)=>{
    console.log(request.protocol+"://"+request.get('host'));
    if((request.protocol+"://"+request.get('host'))==("http://"+host))
    {
        console.log("Domain is matched. Information is from Authentic email");
        if(request.query.id==rand)
        {
            console.log("email is verified");
           return response.sendFile(__dirname+'/Login_v4/Login_v4/success.html');
           

           // response.send("<h1>Email "+mailOptions.to+" is been Successfully verified");
        }
        else
        {
            console.log("email is not verified");
            response.end("<h1>Bad Request</h1>");
        }
    }
    else
    {
        response.end("<h1>Request is from unknown source");
    }
    });
    app.post('/emailCheck',async(request,response)=>{
        try {
            var user = await UserModel.findOne({ email: request.body.email }).exec();
            if(!user) {
                return response.status(400).send({message:"The email does not exist"});
            }
            else{
                UserModel.findOne({email: request.body.email}, function(err, user){
                    if(err)return ("err");
                    user.password = request.body.password;
                    console.log(user.password);
                    user.save(function(err){
                       if(err)return ("err");
                       //user has been updated
                     });
                     return response.sendFile(__dirname+'/Login_v4/Login_v4/change_success.html');
                   });
                   
                   
                
        
               // return response.sendFile(__dirname+'/Login_v4/Login_v4/reset_step2.html');
            }
        }catch (error) {
            response.status(500).send(error)
        }
        });
app.post('/resetPass',async(request,response)=>{
    UserModel.findOne({email: request.body.email}, function(err, user){
        if(err)return handleErr(err);
        user.password = request.body.password;
        user.save(function(err){
           if(err)return ("err");
           //user has been updated
         });
       });
    });

app.post("/dump", async (request, response) => {
    try {
        var result = await UserModel.find().exec();
        response.send(result);
    } catch (error) {
        response.status(500).send(error);
    }
});

app.listen(3000, () => {
    console.log("Listening at :3000...");
});
