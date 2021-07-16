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
  if (!body.likes) {
    body.likes = 0
  }
  if (!body.title || !body.url) {
    response.status(400).end()
  } else {
    const user = await User.find({});
    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user: user[0]._id
    })
    console.log(blog)
    const savedBlog = await blog.save()
    user[0].blogs = user[0].blogs.concat(savedBlog._id)
    await user[0].save()

    response.status(201)
    response.json(savedBlog.toJSON())
  }
})

blogRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
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