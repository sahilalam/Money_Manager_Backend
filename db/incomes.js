require('dotenv').config();
const mongodb=require('mongodb');
const mongoClient=mongodb.MongoClient;
const db_url=process.env.DB_URL;
const db_name=process.env.DB_NAME;
const incomes_collection='incomes';
const objectId=mongodb.ObjectId;

const {addIncomeUser,checkEmail}=require("./users.js");
const {convertToIst}=require('./utilities.js');

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

let getIncomes=async(filter,email)=>{
    try{
        const client=await mongoClient.connect(db_url);
        const db=await client.db(db_name);
        const user=await checkEmail(email);
        let incomes=user.incomes;
        let from,to;
        if(filter)
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
        let data=await db.collection(incomes_collection).find({$and:[{"_id":{$in:incomes}},{"date":{$lte:to,$gte:from}}]}).sort({'date':-1}).toArray();
        for(let i=0;i<data.length;i++)
        {
            let date=data[i].date;
            date=new Date(date)-0;

            let now=new Date();
            now=convertToIst(now);

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
    addIncome,getIncomes,updateIcomeAmount,updateIncomeDescription
}