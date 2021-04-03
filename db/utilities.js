let convertToIst=(date)=>{
    date=date.getTime() 
    date=new Date(date);
    date.setHours(date.getHours() + 5); 
    date.setMinutes(date.getMinutes() + 30);
    date=new Date(date);
    return date;

}
export default convertToIst;