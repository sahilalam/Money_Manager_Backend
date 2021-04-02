require('dotenv').config();
const mongodb=require('mongodb');
const mongoClient=mongodb.MongoClient;
const db_url=process.env.DB_URL;
const db_name=process.env.DB_NAME;
const expenditures_collection='expenditures';
const objectId=mongodb.ObjectId;
const {addExpenseUser,checkEmail} =require("./users.js")

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
        let expenditures=user.expenditures;
        expenditures=expenditures.map((id)=>{
            return new objectId(id);
        })
        let from,to,category=null,division=null;

        if(filter)
        {
            if(filter.from)
            {
                from=filter.from;
                if(filter.to)
                {
                    to=filter.to
                }
                else
                {
                    to=new Date();
                }
            }
            else
            {
                to=new Date();
                from=to-7776000000;
                from=new Date(from);
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
            from=to-7776000000;
            from=new Date(from);
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

        const data=await db.collection(expenditures_collection).find({$and:f}).sort({'date':-1}).toArray();

        client.close();
        return data;

    }
    catch(err)
    {
        throw err;
    }
}

let checkUpdateExpense=async(id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(expenditures_collection).findOne({"_id":id});
        client.close();
        const date=data.date;
        let now=new Date();

        if(now-date<43200000)
        {
            return true;
        }
        return false;
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
    addExpense,updateExpenseAmount,updateExpenseCategory,updateExpenseDescription,updateExpenseDivision,checkUpdateExpense,getExpense
}
