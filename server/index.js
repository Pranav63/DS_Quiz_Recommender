const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors')

const qm = require('./questions.js')
const um = require('./user.js')
const path = require("path")
require('./db.js')

const app = express();


app.use(cors({
    origin: '*'
}))


//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var base = express.Router()
app.use('/api/v1', base)
 
base.route('/questions').
    get(qm.getAll)
    
base.route('/question')
    .get(qm.getQuestion)

base.route('/user')
    .post(um.login)
    
base.route('/user/submit')
    .post(um.submit)


base.get('/test', (req, res) => {
    res.send('Hello World, from express');
});

app.listen(8081, ()=>{
    console.log("8081")
});
