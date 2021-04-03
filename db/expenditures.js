require('dotenv').config();
const mongodb=require('mongodb');
const mongoClient=mongodb.MongoClient;
const db_url=process.env.DB_URL;
const db_name=process.env.DB_NAME;
const expenditures_collection='expenditures';
const objectId=mongodb.ObjectId;
const {addExpenseUser,checkEmail} =require("./users.js");
const {convertToIst}=require('./utilities.js');

let addExpense=async(amount,description,division,category,email,date)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        const data=await db.collection(expenditures_collection).insertOne({amount,description,division,category,date:new Date(date)});
        const id=data.ops[0]._id;
        await addExpenseUser(id,email);

        client.close();

    }
    catch(err)
    {
        throw err;
    }
}

let getExpense=async(filter,email)=>
{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        const user=await checkEmail(email);
        let expenditures=user.expenses;

        let from,to,category=null,division=null;

        if(filter)
        {
            if(filter.from)
            {
                from=filter.from;
                from=convertToIst(from);
                if(filter.to)
                {
                    to=filter.to;
                    to=convertToIst(to);
                }
                else
                {
                    to=new Date();
                    to=convertToIst(to);
                }
            }
            else
            {
                to=new Date();
                to=convertToIst(to);
                from=to-7776000000;
                from=new Date(from);
                from=convertToIst(from);
                
            }
            if(filter.category)
            {
                category=filter.category
            }
            if(filter.division)
            {
                division=filter.division
            }
            
 
        }
        else
        {
            to=new Date();
            to=convertToIst(to);
            from=to-7776000000;
            from=new Date(from);
            from=convertToIst(from);
        }
        let f=[
            {
                "_id":{
                    $in:expenditures
                }
            }
            ,{
            "date":{
                $lte:to,
                $gte:from
            }
        }];
        if(category)
        {
            f.push({
                "category":{$eq:category}
            });
        }
        if(division)
        {
            f.push({
                "division":{$eq:division}
            })
        }

        let data=await db.collection(expenditures_collection).find({$and:f}).sort({'date':-1}).toArray();
        for(let i=0;i<data.length;i++)
        {
            let date=data[i].date;
            date=new Date(date)-0;

            let now=new Date();
            now=convertToIst(now)
            
            if(now-date<43200000)
            {
                data[i].check=true;
            }
            else
            {
                data[i].check=false;
            }
        }
        
        client.close();
        return data;

    }
    catch(err)
    {
        throw err;
    }
}

let updateExpenseAmount=async(amount,id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(expenditures_collection).updateOne({"_id":id},{$set:{"amount":amount}});

        client.close();

    }
    catch(err)
    {
        throw err;
    }

}
let updateExpenseDescription=async(description,id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(expenditures_collection).updateOne({"_id":id},{$set:{"description":description}});

        client.close();

    }
    catch(err)
    {
        throw err;
    }

}
let updateExpenseCategory=async(category,id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(expenditures_collection).updateOne({"_id":id},{$set:{"category":category}});

        client.close();

    }
    catch(err)
    {
        throw err;
    }

}
let updateExpenseDivision=async(division,id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(expenditures_collection).updateOne({"_id":id},{$set:{"division":division}});

        client.close();

    }
    catch(err)
    {
        throw err;
    }

}
module.exports={
    addExpense,updateExpenseAmount,updateExpenseCategory,updateExpenseDescription,updateExpenseDivision,getExpense
}
