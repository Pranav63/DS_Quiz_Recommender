import React from 'react'
import { render } from 'react-dom'
import { useLocalStore, observer, } from "mobx-react-lite"
import sample from '../server/sample.json'
import { observable, toJS, autorun } from 'mobx';
import * as R from 'ramda'
import axios from 'axios'
import {Typography, Container, Paper, TextField, makeStyles, AppBar, Toolbar, Divider, Input, Button, FormLabel, FormControl, FormControlLabel, RadioGroup, Radio} from '@material-ui/core';


const api = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
  timeout: 1000,
});

console.log(api)

const useStyles = makeStyles(theme => ({
  offset: theme.mixins.toolbar*2,
}))

const lg = console.log
window.js = toJS
const storeContext = React.createContext(null)

export const StoreProvider = ({ children }) => {
    const store = useLocalStore(createStore)
    return <storeContext.Provider value={store}>{children}</storeContext.Provider>
}

export const useStore = () => {
    const store = React.useContext(storeContext)
    if (!store) {
        // this is especially useful in TypeScript so you don't need to be checking for null all the time
        throw new Error('useStore must be used within a StoreProvider.')
    }
    return store
}


function score(ans) {
    const noEmpty = ans.filter(x => x.answer != null).map((x, i) => {
        if (x.answer == x.Solution) {
            return true
        } else {
            return false
        }

    })
    const sc = noEmpty.filter(x => x)
    const res = sc.length / noEmpty.length
    return isNaN(res) ? 0 : res * 100
}

function addFields(x) {
    x.answer = null; x.isRight = false;
    return x

}

function formatQuestions(questions) {
    const a = questions.map(addFields)
    const { groupBy, prop, map } = R
    return R.pipe(
        groupBy(prop('Topic')),
        map(groupBy(prop('Difficulty')))
    )(a)
}

function getQuestion(topic, diff) {
    return api.get('/question', {params: {
        topic, difficulty: diff
    }}).then(x=>{
        return x.data
    }).catch(x=>{
        console.log(x)
    })
}

function flattenQuestions(questions){
    return R.flatten((R.map(R.values, R.values(questions))))
}

function submitFormat({scores, totalScore, questions}){
    const all = flattenQuestions(questions)
    const totalAnswered = all.filter(x=>x.answer != null).length
    const complete = (all.length - totalAnswered) == 0
    const data = {totalScore: toJS(totalScore), scores: toJS(scores), questions: toJS(questions), totalAnswered: totalAnswered, complete: complete}
    return data
}

function createStore() {
    const a = observable({
        name: "",
        setName(ev) {
            this.name = ev.target.value
        },
        login() {
            //http   
            console.log("logging")

                axios.post("http://localhost:8081/api/v1/user", {
                    name: this.name
                }
                
                ).then(x=>{
                    this.questions = x.data.questions
                    this.user = x.data.user
                    console.log(x)
                }).catch(x=>{    console.log(x);
            
        })}, 
        questions: [],      
        get scores() {
            return R.mapObjIndexed((val, key, obj) => {
                return R.mapObjIndexed((valx, diff, obj) => {
                    return score(valx)
                }, this.questions[key])
            }, this.questions)
        },
        get answered() {
            return R.mapObjIndexed((val, key, obj) => {
                return R.mapObjIndexed((valx, diff, obj) => {
                    return valx.filter(x => x.answer != null).length
                }, this.questions[key])
            }, this.questions)
        },
        get flattened(){
          return flattenQuestions(this.questions)  
        },
        get scoresTotal() {
            const a = score(this.flattened)
            return a
        },
        get completed(){
            const totalAnswered = this.flattened.filter(x=>x.answer != null).length
            return {count: this.flattened.length, answered: totalAnswered}
        },
        answer(key, diff, ind) {
            return (e) => {
                const val = e.currentTarget.value
                const tar = this.questions[key][diff][ind]
                this.questions[key][diff][ind].answer = val
                this.questions[key][diff][ind].isRight = val == tar.Solution
            }
        },
        submitDisable: false,
        submit(){
            this.submitDisable = true
            const a = submitFormat({scores: this.scores, questions: this.questions, totalScore: this.scoresTotal})
            api.post("/user/submit", {data: a, user: this.user}).then(x=>{
                this.questions = []
                this.user = null
                this.name = ""
                this.submitDisable = false
            }).catch(x=>{
                this.submitDisable = false
                window.alert("error")
            })
        },
        testAnswerAllCorrectly(){
            return R.mapObjIndexed((val, key, obj) => {
                return R.mapObjIndexed((valx, diff, obj) => {
                     this.questions[key][diff].map((x,i)=>{
                        this.questions[key][diff][i].answer = this.questions[key][diff][i].Solution
                     })
                }, this.questions[key])
            }, this.questions)
        }
        // get topics() {
        //     return R.groupWith(R.equals, this.questions.map(x => x.Topic))
        // }
    })
    //fetch more questions if grade is bad for a topic
    autorun((() => {
        R.mapObjIndexed((val, key, obj) => {
            R.mapObjIndexed((val, diff, obj) => {
                if (a.answered[key][diff] > 1 && a.answered[key][diff] == a.questions[key][diff].length) {
                    if (val < 80) {
                        getQuestion(key, diff).then(x => {
                            console.log(x)
                            a.questions[key][diff].push(x)
                        })
                    }
                }
            }, val)
        }, a.scores)
    }))
    window.a = a
    return a
}
window.R = R
// <div key={x.QN+x.answer+i}>
//                                                             {x.Topic} {x.Difficulty}: {x.QN}
//                                                             {x.answers.map((y, yi) => {
//                                                                 const checked = y.key == x.answer
//                                                                 const wrong = x.Solution != y.key
//                                                                 return (
//                                                                     <div key={y.key}>
//                                                                         <input type="radio" disabled={answered} value={y.key} onChange={onChange} checked={checked} />
//                                                                         <label>{answered && checked ? store.scores[key][diff] + (wrong ? " Wrong: " : " Right: ") : ""}{y.value}</label>
//                                                                     </div>
//                                                                 )
//                                                             })}
//                                                         </div>
const App = observer(() => {
    const store = useStore()
    const classes = useStyles()
    return (
        <>
        <AppBar position="fixed">
        <Toolbar variant="dense">
            <Typography>
            {store.scoresTotal}% Right, {store.completed.answered}/{store.completed.count} answered
            </Typography>
            </Toolbar>
            </AppBar>
            <div className={classes.offset}
            style={{paddingTop: "80px"}}>
            <h2 align="center" style={{ background: '#add8e6' }}>Data expert.IO </h2>
            <TextField inputStyle={{ textAlign: 'center' }} 
            style={{ width: '600px' }} onChange={store.setName} value={store.name} label="Login"/>
            <Button inputStyle={{ textAlign: 'center' }} 
            style={{ width: '500px' }}   onClick={store.login} variant="contained" color="default">
                Log In/will reset
            </Button>
            <Button inputStyle={{ textAlign: 'center' }} 
            style={{ width: '300px' }} onClick={store.submit} disabled={store.submitDisable} variant="contained" color="secondary">
                Submit/save/logout
            </Button>
            <Container>
            <Paper>
            <div style={{padding: "0 15px"}}>
            {R.flatten(R.values(R.mapObjIndexed((val, key, obj) => {
                return R.values(R.mapObjIndexed((val, diff, obj) => {
                    return val.filter(x=>{
                        console.log(key, diff)
                        if (diff == 1 && store.questions[key][diff].length != store.answered[key][diff]){

                            return true
                        } else if (diff != 1 && store.questions[key][diff-1].length == store.answered[key][diff-1] && store.questions[key][diff].length != store.answered[key][diff]){
                            return true
                        } else {
                            return false
                        }
                    }).map((x, i, arr) => {
                        const onChange = store.answer(key,diff, i)
                        const answered = x.answer != null   
                        const wrong = x.Solution != x.answer
                        return (
                            <div key={x.QN+x.answer} style={{paddingTop: "30px"}}>
     <FormControl component="fieldset" >
        <FormLabel component="legend">{x.Topic} {x.Difficulty} {answered ? store.scores[key][diff] + (wrong ? " Wrong: " : " Right: ") : ""}: {x.QN}</FormLabel>
        <RadioGroup aria-label="gender" name="gender1" value={x.answer} onChange={onChange}>
            {x.answers.map((y, yi) => {
            const checked = y.key == x.answer
                                    return (
                                    <FormControlLabel disabled={answered} key={y.key} value={y.key} control={<Radio />} label={y.value} />
                                    )
                                })}
        </RadioGroup>
      </FormControl>
                    <Divider variant="middle" />
      </div>
                        
                        )
                    })
                }, val))
            }, store.questions)))
            }
            {/* {R.values(R.mapObjIndexed((val, key, obj) => {
                return val.map((x, i) => {
                    const onChange = store.answer(key, i)
                    const answered = x.answer != null
                    return (
                        <div key={x.QN}>
                            {x.Topic}: {x.QN}
                            {x.answers.map((y, yi) => {
                                const checked = y.key == x.answer
                                const wrong = x.Solution != y.key
                                return (
                                    <div key={y.key}>
                                        <input type="radio" disabled={answered} value={y.key} onChange={onChange} checked={checked} />
                                        <label>{answered && checked ? store.scores[key] + (wrong ? " Wrong: " : " Right: ") : ""}{y.value}</label>
                                    </div>
                                )
                            })}
                        </div>

                    )
                })
            }, store.questions))
            } */}
            </div>
            </Paper>
            </Container>
            </div>
        </>
    )
})

render(
    <StoreProvider>
        <App />
    </StoreProvider>,
    document.getElementById('root')
)            
