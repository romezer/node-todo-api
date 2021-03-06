var express = require('express');
var bodyParser = require('body-parser');
const _ = require('lodash');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/users');
var {authenticate} = require('./middleware/authenticate');
const {ObjectID} = require('mongodb');


var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req,res) => {
	var todo = new Todo({
		text: req.body.text
	});

	todo.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	})
});

app.get('/todos',(req,res) =>{
	Todo.find().then((todos) => {
		res.send({todos});
	}, (e) => {
		res.status(400).send(e);	
	});
});

app.get('/todos/:id',(req,res) => {
	var id = req.params.id;
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	Todo.findById(id).then((todo) => {
		if(!todo){
			return res.status(404).send();
		}
		res.send({todo});
	}).catch((e) =>{
		res.status(400).send();
	});
});

app.post('/users', (req,res) => {
	var user = new User({
		email: req.body.email,
		password: req.body.password
	});

	user.save().then(() => {
		return user.generateAuthToken();
}).then((token) =>{
	console.log('token',token);
	res.header('x-auth',token).send(user);
}).catch((e) => {
		console.log('Error',e);
		res.status(400).send(e);
	})
});


app.get('/users/me', authenticate,  (req,res) => {
	res.send(req.user);
});



app.post('/users/login', (req, res) => {
	var body = _.pick(req.body, ['email','password']);

	User.findByCredentials(body.email, body.password).then((user) => {
		return user.generateAuthToken().then((token) =>{
			res.header('x-auth',token).send(user);
		});
	}).catch((e) => {
		console.log(e);
		res.status(400).send();
	});
});

app.delete('/users/me/token', authenticate, (req, res) => {
	req.user.removeToken(req.token).then(() =>{
		res.status(200).send();
	}, () => {
		res.status(400).send();
	});
});

app.delete('/todos/:id',(req,res) =>{
	var id = req.params.id;

	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	Todo.findByIdAndRemove(id).then((todo) =>{
		if(!todo){
			return status(404)
		}
		res.send(todo);
	}).catch((e) =>{
		res.status(400).send();
	});
})





app.listen(port, ()=> {
	console.log(`Started on port ${port}`);
});

module.exports = {app};