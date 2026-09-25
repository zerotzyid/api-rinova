const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const router = require('./routes/index')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(fileUpload({createParentPath:true}))

const R = require('./helpers/response')
const { RATE_LIMIT_PER_MIN } = require('./helpers/config')

const hits = new Map()
app.set('trust proxy', 1)
app.use((req, res, next) => {
    const now = Date.now()
    const key = req.ip || 'anon'
    const arr = (hits.get(key) || []).filter((t) => now - t < 60000)
    arr.push(now)
    hits.set(key, arr)
    if (arr.length > RATE_LIMIT_PER_MIN) return R.fail(res, 429, 'terlalu banyak permintaan, coba lagi nanti')
    next()
})
app.use('/api',router)
app.get('/player/*',(req,res)=>require('./controllers/anime.controller').playerPage(req,res))
app.get('/',(req,res)=>{
    res.send({
        message : 'Welcome To Unofficial Otakudesu Rest Api',
        createdBy : 'Zyarexx/Rakarmp Create With Love <3'
    })
})
app.use('/api',(req,res) =>{
    res.status(404).json({
        status:'not found path',
        message:'check our github for more info',
        github :'https://github.com/rakarmp/unofficial-otakudesu-api'
    })
})


app.use('*',(req,res) =>{
    res.status(404).json({
        'status':'not found path',
        message: 'read the docs here https://github.com/rakarmp/unofficial-otakudesu-api'
    })
})
app.listen(port, () => {
    console.log('listening on port', port)
})

module.exports = app