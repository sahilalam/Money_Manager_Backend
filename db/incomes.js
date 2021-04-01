require('dotenv').config();
const mongodb=require('mongodb');
const mongoClient=mongodb.MongoClient;
const db_url=process.env.DB_URL;
const db_name=process.env.DB_NAME;
const incomes_collection='incomes';
const objectId=mongodb.ObjectId;

const {addIncomeUser}=require("./users.js");

let addIncome=async(amount,description,email,date)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        const data=await db.collection(incomes_collection).insertOne({amount,description,date:new Date(date)});
        const id=data.ops[0]._id;
        await addIncomeUser(id,email);
        client.close();

    }
    catch(err)
    {
        throw err;
    }

}
let getIncomes=async(filter)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        let from,to;
        if(filter)
        {
            from=filter.from;
            if(filter.to)
            {
                to=filter.to;   
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
        const data=await db.collection(incomes_collection).find({"date":{$lte:to,$gte:from}}).sort({'date':-1}).toArray();
        client.close();
        return data;
    }
    catch(err)
    {
        throw err;
    }

}
let checkUpdateIncome=async(id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(incomes_collection).findOne({"_id":id});
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
let updateIcomeAmount=async(amount,id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(incomes_collection).updateOne({"_id":id},{$set:{"amount":amount}});
        client.close();
    }
    catch(err)
    {
        throw err;
    }

}
let updateIncomeDescription=async(description,id)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        id=new objectId(id);
        const data=await db.collection(incomes_collection).updateOne({"_id":id},{$set:{"description":description}});
        client.close();
    }
    catch(err)
    {
        throw err;
    }

}
module.exports={
    addIncome,getIncomes,checkUpdateIncome,updateIcomeAmount,updateIncomeDescription
}