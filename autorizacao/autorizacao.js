function autorizacao(req, res, next){
    if(req.session.usuario != undefined)
        next(); //Segue o fluxo.
    else
        res.redirect("/");
};

module.exports = autorizacao;
