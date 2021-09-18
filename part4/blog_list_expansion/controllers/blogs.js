const blogRouter = require('express').Router()
const userExtractor = require("../utils/middleware").userExtractor
const Blog = require('../models/blog')
require('express-async-errors')

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs.map(blog => blog.toJSON()));
})

blogRouter.post('/', userExtractor, async (request, response) => {
  const body = request.body
  if (!body.likes) {
    body.likes = 0
  }
  if (!body.title || !body.url) {
    return response.status(400).json({ error: "title and url required"})
  } 
  const user = request.user

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

blogRouter.delete('/:id', userExtractor, async (request, response) => {
  const user = request.user
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    return response.status(401).json({ error: 'blog does not exist' })
  }
  if (blog.user.toString() === user._id.toString()) {
      await blog.deleteOne()
      return response.status(204).end()
  }
  return response.status(401).json({ error: 'token missing or invalid user' })
})

blogRouter.put('/:id', userExtractor, async (request, response) => {
  const body = request.body
  const blog = {
    likes: body.likes
  }
  const newNote = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(newNote);
})

module.exports = blogRouter