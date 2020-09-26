const Sequelize = require('sequelize');

const conexao = new Sequelize('contatosbd', 'contatosbd', 'Nky#2007.', {
    host: 'mysql669.umbler.com',
    dialect: 'mysql',
    timezone: '-03:00'
});

module.exports = conexao;