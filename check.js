const https=require('https');
const url='https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/India_Gate_in_New_Delhi_03-2016.jpg/400px-India_Gate_in_New_Delhi_03-2016.jpg';
https.get(url,res=>{
  console.log('status',res.statusCode);
  res.on('data',()=>{});
  res.on('end',()=>process.exit());
});
