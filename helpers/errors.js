const notFound = (req, res, message = "data tidak ditemukan") => {
    if (res.headersSent) return;
    res.status(404).json({ status: false, message });
};
const on404 = (req,res)=>{
    res.status(404)
    .json({
        status:'not found path',
        animeList:[]
    })
}
const requestFailed = (req,res,err)=>{
    if(res.headersSent){
        return
    }
    res.status(502).send({
        'status':false,
        'message':err.message
    })
}
module.exports = {on404,requestFailed,notFound}
