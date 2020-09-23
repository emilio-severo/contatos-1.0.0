const Sequelize = require('sequelize');

const conexao = new Sequelize('contatosbd', 'postgres', 'postgres', {
    host: 'localhost',
    dialect: 'postgres',
    timezone: '-03:00'
});

module.exports = conexao;