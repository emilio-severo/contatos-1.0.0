const Sequelize = require('sequelize');
const conexao = require('./conexao');
const Categorias = require('./Categorias');

const Contatos = conexao.define('contatos', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: Sequelize.STRING,
    email: Sequelize.STRING,
    nascimento: Sequelize.DataTypes.DATEONLY
});

Categorias.hasMany(Contatos, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

Contatos.belongsTo(Categorias);

Contatos.sync({force: false});

module.exports = Contatos;



