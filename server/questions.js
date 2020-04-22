const dba = require('./db.js')
const db = dba.db
const merge = require('deepmerge')
var aql = require('arangojs').aql;

//compiles a test
function getAllQ (questionsList){
    if (typeof questionsList != "undefined" && questionsList.length != 0){
        questionsList = 'questions'
    }
    
    return db.query(aql`
    FOR q IN questions
    SORT RAND()
    LET answers = (FOR a, o IN OUTBOUND q options
        RETURN MERGE(KEEP(a, "key", "value", "_id"), KEEP(o, 'right'))
    )
    LET res = MERGE(q, {answers: answers})
    COLLECT diff = q.Difficulty,
            topic = q.Topic INTO tdq
    LET rest = (FOR qx IN tdq[*] LIMIT 4 return qx)
    RETURN {[topic]: {[diff]: rest[*].res}}
    `).then(x => x.all()).then(x=>{
        return x.reduce((a,x)=>{
            return merge(a, {[Object.keys(x)[0]]: Object.values(x)[0]})
        }, {})
    }).catch(x=>{console.log("getallq",x.response.body)})
}

exports.getAllQ = getAllQ

//  getAllQ().then(x=>console.log(x.CNN[3][0]))
/* the idea is to get the question from a specific topic with a certain level difficulty*/
function getOne({topic, difficulty}){
        return db.query(aql`
FOR q IN questions
    FILTER q.Topic == ${topic} && q.Difficulty == ${difficulty}
    SORT RAND()
    LIMIT 1
    LET answers = (FOR a, o IN OUTBOUND q options
        RETURN MERGE(KEEP(a, "key", 'value'), KEEP(o, 'right'))
    )
    LET res = MERGE(q, {answers: answers})
    RETURN res
    `)
    .then(x => x.all())
    .then(x=>{
        return x[0]
    })
    .catch(x=>console.log(x.body))
}


exports.getAll = async (req, res, next) => {
    try {
        const question = await getAllQ();
        res.status(200).json({
            question
        });
    } catch (err) {
        res.status(400).json({
            success: false
        });
    }
};


exports.getQuestion = async (req, res, next) => {
    try {
        const question = await getOne(req.query)
        res.status(200).json({
            ...question
        });
    } catch (err) {
        res.status(400).json({
            success: false
        });
    }
};


exports.create = function(){
    
}

exports.createQuestion = async (req,res,next)=>{
    try {
                const question = await create(req.query)
        res.status(200).json({
            ...question
        });
    } catch (err){
                res.status(400).json({
            success: false
        });
    }
}
