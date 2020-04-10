# DS_Quiz_Recommender
It is a project built to showcase understanding of a GraphDB(ArangoDB) as to how we can maintain users data who perform on a test and if they score over a certain threshld are give a set of harder questions from the pool. 

# DB schema
user -> selections(edge) -> answers <- options(edge) <- questions
arrow represents directions of edge

## user: name, incompleteTest: {questions}, testCount

## selections: totalAnswered, totalScore, scores, testCount

This is a separate edge, because I though you may to know who else selected that answer,
and how well he did overall on his test

## answers: key, value

## options: isRight/right

## questions: Solution, QN, etc...



Therere some functions for flattening and deflattening questions out of array and into object.object.array on client side.
I considered flattening and deflattening the state on client side, and keeping everything flat on server.

Set of questions belonging to specific test are tracked with testCount.

Instead of tracking current difficulty entire incomplete test is served 
(the test immidiately has all of the questions by topic and difficulty)

db.js contains scripts for seeding the database, they erase all documents, and reinsert them.
all users answers will be lost. You can still just insert questions, but the script doesn't
check for duplicates before inserting. There's link in that file for converting excel data to json.

There's arangodb web interface.

When saving incomplete quiz, it will not be stored in graph, because of the way graph is set up (user's answers have a relation straight to the answer document, and not the question document).

fetchByTopic function in users, that fetches questions, answers, and scores by topic.
if you'd like to see this for all users, just map over users array passing in that function.

