const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const User = require('./models/user')
const Lesson = require('./models/lesson')

// Express stuff
app.use(express.json())

// MongoDB stuff
const dbConnString = 'mongodb+srv://Dylan:qwertyuiop@cluster0.alspe.mongodb.net/testDB?retryWrites=true&w=majority' // Connection string
mongoose.connect(dbConnString, { useNewUrlParser: true, useUnifiedTopology: true }) // Connect to database
    .then((result) => app.listen(3000)) // After successful connection, server listen on port 3000
    .catch((err) => console.log(err)); // Send error to console on failed connection



// Add user info to DB
app.get('/add-user', (req, res) => {
    const user = new User(
    {
        accountIdentifier: 'testID',
        email: 'test@gmail.com',
        passwordHash: 'fdsgdsfgwgwgegwgwgwg',
        lessonCompleted: [1, 2, 3]
    });

    user.save()
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            console.log(err)
        })

})

// Add lesson info to DB
app.get('/add-lesson', (req, res) => {
    const lesson = new Lesson(
    {
        accountIdentifier: 'testID',
        lessonData: 'test lesson data',
        lessonID: '1'
    });

    lesson.save()
        .then((result) => {
            res.send(result)
        })
        .catch((err) => {
            console.log(err)
        })

})

// Users container for testing
const users = []

// Get user info
app.get('/users', (req, res) => {
    res.json(users)
})

// Post user info
app.post('/users', async (req, res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 10) // Encrypt password
        const user = { name: req.body.name, password: hashedPassword } // Set user information
        users.push(user)
        res.status(201).send()
    } 
    catch{
        res.status(500).send()
    }
})

// Validate user info
app.post('/users/login', async (req, res) => {
    const user = users.find(user => user.name = req.body.name)
    if (user == null) {
        return res.status(400).send('Cannot find user') // If username does not match records
    }
    try{
        if(await bcrypt.compare(req.body.password, user.password))
        {
            res.send('Success') // If username and password both match
        }
        else
        {
            res.send('Not Allowed') // If password is invalid
        }
    }
    catch{
        res.status(500).send()
    }
})


