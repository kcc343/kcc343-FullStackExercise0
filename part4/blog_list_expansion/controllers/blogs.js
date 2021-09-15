const jwt = require('jsonwebtoken')
const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
require('express-async-errors')

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs.map(blog => blog.toJSON()));
})

blogRouter.post('/', async (request, response) => {
  const body = request.body
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  if (!body.likes) {
    body.likes = 0
  }
  if (!body.title || !body.url) {
    return response.status(400).json({ error: "title and url required"})
  } 
  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes,
      user: user._id
  })
  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog)
  await user.save()

  response.status(201).json(savedBlog)
})

blogRouter.delete('/:id', async (request, response) => {
  const body = request.body
  console.log(body)
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const blog = await Blog.findById(request.params.id)
  console.log(blog)
  if (blog.user.toString() === decodedToken.id) {
      await blog.deleteOne()
      response.status(204).end()
  }
  response.status(401).json({ error: 'token missing or invalid user' })
})

blogRouter.put('/:id', async (request, response) => {
  const body = request.body
  const blog = {
    likes: body.likes
  }
  const newNote = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(newNote);
})

module.exports = blogRouter