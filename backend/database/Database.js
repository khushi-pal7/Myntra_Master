const mongoose = require('mongoose')

const { MongoMemoryServer } = require('mongodb-memory-server');

const connectdatabse = async ()=>{
    let dbUri = process.env.DB_URI;
    if (!dbUri) {
        const mongoServer = await MongoMemoryServer.create();
        dbUri = mongoServer.getUri();
        process.env.DB_URI = dbUri;
    }
    
    return mongoose.connect(dbUri, {useNewUrlParser: true,
         useUnifiedTopology:true,
        }).then((data)=>{
        console.log(`Database connected ${data.connection.host}`)
    }).catch(console.error)

}

module.exports = connectdatabse