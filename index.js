const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const conexao = require('./bd/conexao');
const Sequelize = require('sequelize');
const Categorias = require('./bd/Categorias');
const Contatos = require('./bd/Contatos');
const Usuarios = require('./bd/Usuarios');
const formataData = require('./public/js/util');
const bcrypt = require('bcryptjs');
const autorizacao = require("./autorizacao/autorizacao");

//Instancia da aplicação em Express.
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(session({ secret: "Um%55kjds", resave: true, saveUninitialized: true }));

conexao.authenticate();

/*
*   Tratamento da requisição localhost:3000/
*   Mostra a página de autenticação do usuário.
*/

app.get("/", function (req, res) {
    

    Racas
    .findAll()  //select * from categorias
    .then(function(categorias){       //Quando terminar o select 
        Usuarios.findAll()
            .then(function(usuarios){
                res.render("teste", {categorias: categorias, usuarios: usuarios})
            })
    })
    

    /*
    let contatos = Contatos
    .findAll()
    .then(function(contatos){
        return contatos
    })
    .then(function(contatos){
        return contatos
    })
    
    console.log("\n" +contatos)
    */ 

    //res.render("login", { mensagem: "" });
});

app.get("/index", autorizacao, function (req, res) {
    res.render("index", { usuario: req.session.usuario.nome });
})

/*  
*   Rotina de autenticação do usuário.
*/
app.post("/login", function (req, res) {
    Usuarios
        .findOne({ where: { email: req.body.login } })
        .then(function (usuario) {
            if (usuario != undefined) {
                if (bcrypt.compareSync(req.body.senha, usuario.senha)) {
                    req.session.usuario = { id: usuario.id, nome: usuario.nome, email: usuario.email };
                    res.redirect("/index");
                }
                else {
                    res.render("login", { mensagem: "Usuário ou senha inválidos." });
                }
            }
            else
                res.render("login", { mensagem: "Usuário ou senha inválidos." });
        });
});

app.get("/logout", function (req, res) {
    req.session.usuario = undefined;
    res.redirect("/");
});

app.get("/usuarios/novo", function (req, res) {
    res.render("usuarios");
});

app.post("/usuarios/salvar", function (req, res) {
    let nome = req.body.nome;
    let email = req.body.login;
    let senha = req.body.senha;

    let salt = bcrypt.genSaltSync(10);
    let senhaCripto = bcrypt.hashSync(senha, salt);

    Usuarios
        .create({ nome: nome, email: email, senha: senhaCripto })
        .then(
            res.render("login", { mensagem: "Usuário cadastrado." })
        );
});

//------------------------------- REQUISIÇÕES PARA OPERAÇÕES SOBRE CATEGORIAS ------------------------------------------ 

/*
*   Tratamento da requisição /categorias
*   Monta a lista de categorias previamente cadastradas no banco de dados
*   e mostra a página contendo a tabela com os dados.
*/
app.get("/categorias/lista/:mensagem?", autorizacao, function (req, res) {
    Categorias
        .findAll({ order: ["descricao"] }) //findAll() busca todos os registros, order define o campo de ordenação.
        .then(function (categorias) {      //se forem retornados registros de categorias, estas são apresentadas na página.
            if (req.params.mensagem)
                res.render("categorias/categorias", {
                    categorias: categorias,
                    mensagem: "Não foi possível, pois já há um contato relacionado a esta categoria."
                });
            else
                res.render("categorias/categorias", { categorias: categorias, mensagem: "" });
        });

});

/*
*   Quando o usuário clica no botão nova categoria é disparada a requisição /categorias/novo
*   então é renderizada a página para inclusão de uma nova categoria.
*/
app.get("/categorias/novo", autorizacao, function (req, res) {
    res.render("categorias/novo", { mensagem: "" });
});

app.post("/categorias/salvar", autorizacao, function (req, res) {
    let descricao = req.body.descricao;
    Categorias
        .create({ descricao: descricao })
        .then(
            res.render("categorias/novo", { mensagem: "Categoria incluída." }
            ));
});

/*
*   O clique no ícone de edição de uma categoria, apresentado na lista
*   de categorias previamente cadastradas, faz com que a requisição 
*   /categorias/editar/id seja enviada, onde id é o valor da chave primária.
*/
app.get("/categorias/editar/:id", autorizacao, function (req, res) {
    let id = req.params.id;
    Categorias
        .findByPk(id)
        .then(function (categoria) {
            res.render("categorias/editar", { categoria: categoria });
        });
});

/*
*   Quando o usuário clica no botão atualizar da página de edição de categorias
*   a requisição /categorias/atualizar é enviada.
*/
app.post("/categorias/atualizar", autorizacao, function (req, res) {
    let id = req.body.id;
    let descricao = req.body.descricao;
    Categorias
        .update({ descricao: descricao }, { where: { id: id } })
        .then(function () {
            res.redirect("/categorias/lista");
        });
});

/*
*   Ao clicar no botão excluir em um registro da lista de categorias
*   será enviada a requisição /categorias/excluir/id, onde id é a chave primária da categoria.
*/
app.get("/categorias/excluir/:id", autorizacao, function (req, res) {
    let id = req.params.id;
    Categorias
        .destroy({ where: { id: id } })
        .then(function () {
            res.redirect("/categorias/lista");
        })
        .catch(function (erro) {
            if (erro instanceof Sequelize.ForeignKeyConstraintError) {
                res.redirect("/categorias/lista/erro");
            }
        });
});

//------------------------------- REQUISIÇÕES PARA OPERAÇÕES SOBRE CONTATOS ------------------------------------------ 

/*
*   Tratamento da requisição /contatos
*   Monta a lista de contatos previamente cadastrados no banco de dados
*   e mostra a página contendo a tabela com os dados.
*/
app.get("/contatos", autorizacao, function (req, res) {
    Contatos
        .findAll({ order: ["nome"], include: [{ model: Categorias }] })      //findAll() busca todos os registros, order define o campo de ordenação.
        .then(function (contatos) {      //se forem retornados registros de contatos, estes são apresentados na página.
            res.render("contatos/contatos", { contatos: contatos, formataData: formataData });
        });
});

/*
*   Quando o usuário clica no botão novo contato é disparada a requisição /contatos/novo
*   então é renderizada a página para inclusão de um novo contato.
*/

app.get("/contatos/novo/:mensagem?", autorizacao, function (req, res) {
    
    Categorias
        .findAll({ order: ["descricao"] })
        .then(function (categorias) {
            //contatos.forEach(function(contato){
            //    console.log("\n\n" + contato.nome);    
            //})

            if (req.params.mensagem)
                res.render("contatos/novo", { mensagem: "Contato incluído.", categorias: categorias });
            else
                res.render("contatos/novo", { mensagem: "", categorias: categorias });
        });
});

/*
*   Ao usuário clicar no botão salvar na página de cadastro de um novo contato, será disparada
*   a requisição /categorias/salvar que irá inserir o contato na tabela do BD.
*/
app.post("/contatos/salvar", autorizacao, function (req, res) {
    let nome = req.body.nome;
    let email = req.body.email;
    let nascimento = req.body.nascimento;
    let categoria = req.body.categoria;
    Contatos
        .create({ nome: nome, email: email, nascimento: nascimento, categoriaId: categoria })
        .then(
            res.redirect("/contatos/novo/incluido")
        );
});

/*
*   O clique no ícone de edição de um contato, apresentado na lista
*   de contatos previamente cadastrados, faz com que a requisição 
*   /contatos/editar/id seja enviada, onde id é o valor da chave primária.
*/
app.get("/contatos/editar/:id", autorizacao, function (req, res) {
    let id = req.params.id;
    Contatos
        .findByPk(id)
        .then(function (contato) {
            Categorias.findAll()
                .then(function (categorias) {
                    res.render("contatos/editar", { contato: contato, categorias: categorias, formataData: formataData });
                })
        });
});

/*
*   Quando o usuário clica no botão atualizar da página de edição de contatos
*   a requisição /contatos/atualizar é enviada.
*/
app.post("/contatos/atualizar", autorizacao, function (req, res) {
    let id = req.body.id;
    let nome = req.body.nome;
    let email = req.body.email;
    let nascimento = req.body.nascimento;
    let categoria = req.body.categoria;
    Contatos
        .update({ nome: nome, email: email, nascimento: nascimento, categoriaId: categoria }, { where: { id: id } })
        .then(function () {
            res.redirect("/contatos");
        });
});

/*
*   Ao clicar no botão excluir em um registro da lista de contatos
*   será enviada a requisição /contatos/excluir/id, onde id é a chave primária do contato.
*/
app.get("/contatos/excluir/:id", autorizacao, function (req, res) {
    let id = req.params.id;
    Contatos
        .destroy({ where: { id: id } })
        .then(function () {
            res.redirect("/contatos");
        })
});


//Executa o servidor do sistema de controle de contatos, aguardando conexões na porta 3000.
app.listen(3000);


