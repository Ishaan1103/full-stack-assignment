import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser'

const app = express()
const port = 3001

const USERS = [];

const QUESTIONS = [{
    title: "Two states",
    description: "Given an array , return the maximum of the array?",
    testCases: [{
        input: "[1,2,3,4,5]",
        output: "5"
    }]
}];


const SUBMISSION = [

]
const SECERET_KEY = 'IUBGYF6KN@HVHG$hjjhb8'

const generateJsonWebToken = async (email) =>{
  try {
    const token = await jwt.sign({email},SECERET_KEY,{expiresIn:'1d'})
    return token;
  } catch (error) {
    return error
  }
}

const VerfiyJWT = async(req,res,next)=>{
  try {
    const token = req.cookies?.token 
    if (!token) {
      return res.status(400).json({message:'Response token is expired or not found please login again'})
    }
    const details = await jwt.verify(token,SECERET_KEY)
    const user = USERS.find(user => details?.email === user.email)
    if (!user) {
      return res.status(400).json({message:"Please login"})
    }
    req.user = user
    next();
  } catch (error) {
    return res.status(400).json(error.message || 'Something went wrong while VerifyingJWT')
  }
}

app.use(express.json({limit:'1mb'}))
app.use(cookieParser())

app.get('/users',(req,res)=>{
  res.status(200).json({USERS,message:"All users"})
})

app.post('/signup', async function(req,res) {
  // Add logic to decode body
  const { email, password } = req.body
  // body should have email and password
  if (!email || !password) {
    return res.status(400).json({})
  }

  //Store email and password (as is for now) in the USERS array above (only if the user with the given email doesnt exist)
  

  const findUser = USERS.find(user => user.email === email)
  if (findUser) {
    return res.status(400).json({message:"Email already exist in the database please login"})
  }
  const hashPassword = await bcrypt.hash(password,10)
  const addUser ={
    email,
    password:hashPassword,
    admin:true
  }
  USERS.push(addUser)
  // return back 200 status code to the client
  return res.status(200).json({message:"User Created Please login"})
})

app.post('/login', async function(req, res) {
  // Add logic to decode body
  const {email,password} = req.body
  // body should have email and password
  if (!email || !password) {
    return res.status(400).json({message:"Please provide credentials"})
  }
  // Check if the user with the given email exists in the USERS array
  const userFound = USERS.find(user=>user.email === email)
  
  if (!userFound) {
    return res.status(400).json({message:"Email not found please signUp"})
  }
  // Also ensure that the password is the same
  const comparePassword = await bcrypt.compare(password,userFound.password)
  if (!comparePassword) {
    return res.status(400).json({message:"Incorrect Password"})
  }
  const token = await generateJsonWebToken(email)
  const optionHeader = {
    httpOnly:true,
    secure:true
  }
  res.cookie('token',token,optionHeader)
  return res
  .status(200)
  .json({token,message:"Token sent to the user"})
  // If the password is the same, return back 200 status code to the client
  // Also send back a token (any random string will do for now)
  // If the password is not the same, return back 401 status code to the client
})

app.get('/questions', function(req, res) {

  //return the user all the questions in the QUESTIONS array
  return res.status(200).send(QUESTIONS)
})

app.get("/submissions", VerfiyJWT,function(req, res) {
   // return the users submissions for this problem
  const user = req.user
  const findSubmission = SUBMISSION.filter(sub=>sub.user === user.email) 
  if (!findSubmission) {
    return res.status(400).json({message:"Not able to find Any submission"})
  }
  return res.status(200).json({findSubmission,message:"fetched all Data"})
});


app.post("/submissions", VerfiyJWT ,function(req, res) {
   // let the user submit a problem, randomly accept or reject the solution
    const { code, QuestionTitle } = req.body
    if (!QuestionTitle) {
      return res.status(400).json({message:"Question not found"})
    }
    if (!code) {
      return res.status(400).json({message:"code not found"})
    }
    const answer = Math.random() > 0.5
   // Store the submission in the SUBMISSION array above
    const addSubmit = {
      user:req.user.email,
      Answer: answer?'Ac':'Wa',
      code,
      QuestionTitle
    }
    SUBMISSION.push(addSubmit)
    return res.status(200).json({addSubmit,message:"Added to Submission"})
});

// leaving as hard todos
// Create a route that lets an admin add a new problem
// ensure that only admins can do that.
app.post('/addproblem',VerfiyJWT,(req,res)=>{
  const { title, description, testCases } = req.body
  if (! title || !description || !testCases ) {
    return res.status(400).json({message:"Please give All fields"})
  }
  const adminCheck = USERS.find(user => user.email === req.user.email)
  if (!adminCheck.admin) {
    return res.status(400).json({message:"You are not admin"})
  }
  const addQ = {
    title,
    description,
    testCases
  }
  QUESTIONS.push(addQ)
  return res.status(200).json({
    title,
    description,
    testCases,
    message:"Added to the System"
  })
})

app.listen(port, function() {
  console.log(`Example app listening on port ${port}`)
})