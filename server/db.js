var arangojs = require("arangojs");
var aql = require('arangojs').aql;
var sample = require("./sample.json") //http://beautifytools.com/excel-to-json-converter.php
var db = new arangojs.Database({ url: "http://localhost:8529" });
var now = Date.now();

db.createDatabase('quiz').then(
    () => console.log('Database created'),
    err => console.error('Failed to create database:', )
);

db.useDatabase('quiz');


const edges = ["selections", "options"].map(x => db.edgeCollection(x))
edges.map(create)
const selections = edges[0]
const options = edges[1]


const users = db.collection('users');
const questions = db.collection('questions');
const answers = db.collection('answers');

[users, questions, answers].map(create)

function create(x) {
    return x.create().then(
        () => console.log('Collection created'),
        err => console.error('Failed to create collection:', )
    )
}

var mapped = sample.Sheet1.map(x => {
    const mapped = { answers: [], Topic: x.Topic, QN: x.QN, Solution: x.Solution, Difficulty: x.Difficulty }
    for (let key in x) {
        const val = x[key]
        if (key.length == 1) {
            mapped.answers.push({
                key: key,
                value: val,
                right: key == x.Solution
            })
        }
    }
    return mapped
})

//SEEDING/////////////////////

// db.query(`
// FOR a in questions
// REMOVE a in questions
// `)
// db.query(`
// FOR a in answers
// REMOVE a in answers
// `)
// db.query(`
// FOR a in options
// REMOVE a in options
// `)

// db.query('FOR d in answers return d').then(x => x.all()).then(x => {
//     if (x.length == 0) {
//         console.log('creating')
//         db.query(aql `
//   let sample = ${mapped}
//     FOR s IN sample
//     INSERT UNSET(s, "answers") INTO questions
//     LET qnew = NEW
//         FOR a IN s.answers
//         INSERT UNSET(a, "right") INTO answers
//         LET anew = NEW
//         INSERT {_from: qnew._id, _to: anew._id, right: a.right} INTO options
//         RETURN qnew
    
    
// `).then(
//             cursor => cursor.all()
//         ).then(
//             x => console.log('Inserted documents:', x[0]),
//             err => {
//                 console.log(err.response.body)
//             }
//         );
//     }
//     else {
//         console.log("not creating", x)
//     }

// })

exports.db = db
exports.selections = selections
exports.options = options
exports.users = users
exports.questions = questions
exports.answers = answers
