const app = require('./app.js')
const connectdatabse = require('./database/Database.js')
const { Server } = require('socket.io')
const initSquadSocket = require('./services/squadSocket.js')


process.on('uncaughtException', (err)=>{
    console.log(`Error: ${err.message}`)
    console.log(`shutting down server due to uncaught Exception`)
    process.exit(1)
})

const PORT = process.env.PORT || 4000

const server = app.listen(PORT, ()=>{
    console.log(`Server on http://localhost:${PORT}`)
})

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})
initSquadSocket(io)
console.log('Squad Socket.IO initialized')

const Product = require('./model/productmodel.js');
const { exec } = require('child_process');

connectdatabse().then(async () => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            console.log("No products found, launching importer script...");
            exec('node backend/scripts/importData.js', { env: process.env }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Import error: ${error}`);
                    return;
                }
                console.log(stdout);
                if (stderr) console.error(stderr);
            });
        } else {
            console.log(`Products already loaded: ${count}`);
        }
    } catch (e) {
        console.error("Error checking products count: ", e);
    }
    
    try {
        const Contact = require('./model/contactmodel.js');
        const contactCount = await Contact.countDocuments();
        if (contactCount <= 1) { // totalCount is 0 or just the 1 test user
            console.log("Empty friends detected, seeding friends natively...");
            const http = require('http');
            const req = http.request({
                hostname: 'localhost',
                port: PORT,
                path: '/api/v1/friends/seed',
                method: 'POST'
            }, res => {
                console.log(`Friends seeding status: ${res.statusCode}`);
            });
            req.on('error', error => console.error('Seeding error:', error));
            req.end();
        }
    } catch (e) {
        console.error("Error checking contacts count:", e);
    }
});

process.on('unhandledRejection', (err)=>{
    console.log(`Error ${err.message}`);
    console.log(`shutting down server due  unhandle promise rejection`)

    server.close(()=>{
        process.exit(1);
    })
})

