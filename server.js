require('dotenv').config();


const cors=require('cors');
const jwt=require('jsonwebtoken');


const express=require('express');
const app=express();
app.use(cors());
const PORT=process.env.PORT || 3000;

const base64=require('base-64');

const bcrypt=require('bcrypt');
const SR=process.env.SALT_ROUNDS;

const hashPass=async(password)=>{
    try{
        const salt=await bcrypt.genSalt(+SR);
        const hash=await bcrypt.hash(password,salt);
        return hash;
    }
    catch(err)
    {
        throw err;
    }

}

const nodeMailer=require('nodemailer');
const transporter=nodeMailer.createTransport({
    host:process.env.HOST,
    auth:{
        user:process.env.USER,
        pass:process.env.PASS
    },
    tls:{
        rejectUnauthorized:false
    }

})

app.use(express.json());
app.use(express.urlencoded({extended:true}))



const {checkEmail,addUser,login,checkUsername,updatePassword} =require('./db/users.js');
const { addIncome,getIncomes,checkUpdateIncome,updateIcomeAmount,updateIncomeDescription }=require('./db/incomes.js');
const {addExpense,updateExpenseAmount,updateExpenseCategory,updateExpenseDescription,updateExpenseDivision,checkUpdateExpense,getExpense}=require('./db/expenditures.js');

app.post('/register',async(req,res)=>{
    try{
        let email=req.body.email;
        let check=await checkEmail(email);
        if(check)
        {
            console.log("exists")
            res.json({
                message:"User Already Exists!"
            })
        }
        else
        {
           const encrypted_mail=base64.encode(email);
           const href=`${process.env.FRONT_URL}/register/${encrypted_mail}`;
           let html=`<a href=${href}>Click Here</a> to verify your E-Mail`;
           
           let info =await transporter.sendMail({
               from:"Sahil Alam",
               to:email,
               subject:"Verify your mail!",
               text:"Please Click on the below link to verify your mail.",
               html:`${html}`
           });

           res.status(200).json({
               message:"Mail Sent !!! Please Check your mail",
               info
           })

        }
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            message:err.message
        });
    } 
});


app.post('/register/:encrypted_mail',async(req,res)=>{
    try
    {
        let encrypted_mail=req.params.encrypted_mail;
        const email=base64.decode(encrypted_mail);
        const username=req.body.username;
        const password=req.body.password;
        if(username.length && password.length)
        {
            let check=await checkUsername(username);
            if(check)
            {
                res.json({
                    message:"Username already taken,try again with different username"
                })
            }
            else
            {
                const hash= await hashPass(password);
                await addUser(username,hash,email);
                res.status(201).json({
                    message:"User Created!"
                });
            }
        }
        else
        {
            res.status(500).json({
                message:"Either Username or password is empty!"
            });
        }  

    }
    catch(err)
    {
        console.log(err);
        res.status(404).json({
            message:err.message
        });
    }
})


app.post('/login',async(req,res)=>{
    let username=req.body.username;
    let password=req.body.password;
    try{
        const data=await login(username);
        if(data)
        {
            const result=await bcrypt.compare(password,data.password);
            if(result)
            {
                const access_token =await jwt.sign({
                    name:data.name,
                    email:data.email
                },process.env.KEY,{
                    expiresIn:'1h'
                });
                res.status(200).json({
                    access_token,
                    urls:data.urls
                    
                })
            }
            else
            {
                res.status(404).json({
                    message:"Invalid Password"
                })   
            }

        }
        else
        {
            res.status(404).json({
                message:"User Not Found!"
            });
        }
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            message:err.message
        });
    }
}) 

app.post('/forgot_password',async(req,res)=>{
    try{
        let email=req.body.email;
        let check=await checkEmail(email);
        if(check)
        {
            const encrypted_mail=base64.encode(email);
           const href=`${process.env.FRONT_URL}/forgot_password/${encrypted_mail}`;
           let html=`<a href=${href}>Click Here</a> to update your passowrd`;
           
           let info =await transporter.sendMail({
               from:"Sahil Alam",
               to:email,
               subject:"Update your Password!",
               html:`${html}`
           });

           res.status(200).json({
               message:"Mail Sent !!! Please Check your mail"
           })
        }
        else
        {
            res.status(404).json({
                message:"No user fornd with this e-mail"
            })
        }

    }
    catch(err)
    {
        res.status(500).json(
            {
                message:err.message
            }
        )
    }
})

app.put('/forgot_password/:encrypted_mail',async(req,res)=>{
    try{
        let encrypted_email=req.params.encrypted_mail;
        let email=base64.decode(encrypted_email);
        let password=req.body.password;
        const hash=await hashPass(password);
        await updatePassword(email,hash);
        res.status(200).json({
            message:"Password Updated! Please Login to continue.."
        })
    }
    catch(err)
    {
        res.status(500).json(
            {
                message:err.message
            }
        )
    }
})


app.get('/verify_token&get_user_details',async(req,res)=>{
    try{
        let access_token=req.headers.authorization;
        let decoded=await jwt.verify(access_token,process.env.KEY);
        res.status(200).json(
            {
                data:decoded
            }
        )

    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }

})

app.get("/get_income/:from/:to",async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY);
        let from=+req.params.from;
        let to=+req.params.to;
        let filter=null;
        if(from!=0)
        {
            filter={
                from
               
            }
            if(to!=0)
            {
                filter.to=to
            }
            
        }
        const data=await getIncomes(filter,decoded.email);
        res.status(200).json({
            data
        })
    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})

app.post('/add_income',async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY);
        let amount=req.body.amount;
        let description=req.body.description;
        let email=decoded.email;
        let date=req.body.date;
        await addIncome(amount,description,email,date);
        res.status(201).json({
            message:"New Income Added !!" 
        })
    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})

app.get('/check_update_income/:id',async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY);
        let check=await checkUpdateIncome(req.params.id);
        res.status(200).json({
            check
        })
    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})

app.put('/update_income',async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY);
        let check=await checkUpdateIncome(req.body.id);
        if(check)
        {
            if(req.body.amount)
            {
                await updateIcomeAmount(req.body.amount,req.body.id);
            }
            if(req.body.description)
            {
                await updateIncomeDescription(req.body.description,req.body.id);
            }
            res.status(201).json({
                message:"Updated !!"
            })
        }
        else
        {
            res.json({
                message:"Your time to update this income is expired!"
            })
        }
        

    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})

app.post('/add_expense',async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY);
        let amount=req.body.amount;
        let description=req.body.description;
        let division=req.body.division;
        let category=req.body.category;
        let date=req.body.date;
        await addExpense(amount,description,division,category,decoded.email,date);
        res.status(201).json({
            message:"New expenditure added !!"
        })
    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})

app.get('/get_expense/:from/:to/:category/:division',async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY)
        let from=+req.params.from;
        let to=+req.params.to;
        let category=req.params.category;
        let division=req.params.division;
        let filter={};
        if(from!=0)
        {
            filter.from=new Date(from);
            if(to!=0)
            {
                filter.to=new Date(to);
            }
        }
        if(category!=0)
        {
            filter.category=category;
        }
        if(division!=0)
        {
            filter.division=division;
        }
        if(Object.keys(filter).length===0)
        {
            filter=null;
        }
        const data=await getExpense(filter,decoded.email);
        res.status(200).json({
            data
        })
    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})
app.get('/check_update_expense/:id',async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY);
        let check=await checkUpdateExpense(req.params.id);
        res.status(200).json({
            check
        })
    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})

app.put('/update_expense',async(req,res)=>{
    try{
        let decoded=await jwt.verify(req.headers.authorization,process.env.KEY);
        let check=await checkUpdateExpense(req.body.id);
        if(check)
        {
            if(req.body.amount)
            {
                await updateExpenseAmount(req.body.amount,req.body.id);
            }
            if(req.body.description)
            {
                await updateExpenseDescription(req.body.description,req.body.id);
            }
            if(req.body.category)
            {
                await updateExpenseCategory(req.body.category,req.body.id);
            }
            if(req.body.division)
            {
                await updateExpenseDivision(req.body.division,req.body.id);
            }
            res.status(201).json({
                message:"Updated !!"
            })
        }
        else
        {
            res.json({
                message:"Your time to update this income is expired!"
            })
        }
        

    }
    catch(err)
    {
        res.status(500).json({
            message:err.message
        })
    }
})

app.listen(PORT,()=>{
    console.log("SERVER STARTED",PORT)
})
