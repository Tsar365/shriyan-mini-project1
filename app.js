const express = require('express');
const app = express();
const userModels = require('./models/user');
const postModels = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', isLoggedIn, (req, res) => {
    res.render('login');
});

app.get('/profile', isLoggedIn, (req, res) => {
    console.log(req.user);
    res.render('/profile');
});


app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/login');
});


app.post('/register', async (req, res) => {
    let { username, name, email, age, password } = req.body;
    let user = await userModels.findOne({ email });
    if (user) {
        return res.status(500).send('User already exists');
    }
    bcrypt.genSalt(10, (err, salt) => {
        console.log(salt);
        bcrypt.hash(password, salt, async (err, hash) => {
            console.log(hash);
            let user = await userModels.create({
                username,
                name,
                email,
                age,
                password: hash
            });
            let token = jwt.sign({
                email: user.email,
                userid: user._id
            }, "secretkey",)
            res.cookie("token", token);
            res.send("User registered successfully")
        })
    });
});


app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModels.findOne({ email });
    if (!user) {
        return res.status(500).send('something wrong');
    }
    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({
                email: user.email,
                userid: user._id
            }, "secretkey",)
            res.cookie("token", token);
            res.status(200).redirect('/profile');
        } else {
            res.redirect('/login');
        }
    })
});


function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") {
        res.redirect('/login');
    } else {
        let data = jwt.verify(req.cookies.token, "secretkey");
        req.user = data;
        next();
    }
}


app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});