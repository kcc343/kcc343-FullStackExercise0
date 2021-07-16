const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('../utils/blog_helper')

const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlog) {
    let blogObj = new Blog(blog)
    await blogObj.save()
  }
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('blogs have id property', async () => {
  const blogs = await helper.blogsInDb()
  for (let blog of blogs) {
    expect(blog.id).toBeDefined()
  }
})

describe('adding a blog', () => {
  test('blogs can receive POST request', async () => {
    const newBlog = {
      _id: "5a422a851b54a676234d17f4",
      title: "March comes in Like a Lion",
      author: "Chika Umino",
      url: "https://myanimelist.net/anime/31646/3-gatsu_no_Lion",
      likes: 40
    }
  
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
  
    const responseAfter = await helper.blogsInDb()
    expect(responseAfter).toHaveLength(helper.initialBlog.length + 1)
  })

  test('blog with no likes in request defaults to zero', async () => {
    const newBlog = {
      _id: "5a422a851b54a676234d17f4",
      title: "March comes in Like a Lion",
      author: "Chika Umino",
      url: "https://myanimelist.net/anime/31646/3-gatsu_no_Lion",
    }
  
    const newBlogMade = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)

    const findBlog = await helper.specificBlog(newBlogMade.body.id)
    expect(findBlog.likes).toBe(0)
  })

  test('blog with no title property returns 400 status code', async () => {
    const newBlog = {
      _id: "5a422a851b54a676234d17f4",
      author: "Chika Umino",
      url: "https://myanimelist.net/anime/31646/3-gatsu_no_Lion",
      likes: 40
    }
  
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
  })

  test('blog with no url property returns 400 status code', async () => {
    const newBlog = {
      _id: "5a422a851b54a676234d17f4",
      title: "March comes in Like a Lion",
      author: "Chika Umino",
      likes: 40
    }
  
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
  })

  test('blog with no title and url property returns 400 status code', async () => {
    const newBlog = {
      _id: "5a422a851b54a676234d17f4",
      author: "Chika Umino",
      likes: 40
    }
  
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
  })  
})

describe('deleting a blog post', () => {
  test('successful with status code 204 if id is valid', async () => {
    const blogStart = await helper.blogsInDb()
    const blogDelete = blogStart[0] 

    await api
      .delete(`/api/blogs/${blogDelete.id}`)
      .expect(204)
    
    const blogEnd = await helper.blogsInDb()

    expect(blogEnd).toHaveLength(helper.initialBlog.length - 1)
    const contentOfBlogs = blogEnd.map(blog => blog.id)
    expect(contentOfBlogs).not.toContain(blogDelete.id)
  })
})

describe('updating a blog post', () => {
  test('updates blog likes', async () => {
    const blogStart = await helper.blogsInDb()
    const blogUpdate = blogStart[0] 
    const blog = {
      likes: 0
    }

    const updateBlog = await api.put(`/api/blogs/${blogUpdate.id}`).send(blog)
    
    const blogEnd = await helper.blogsInDb()

    expect(blogEnd).toHaveLength(helper.initialBlog.length)
    const contentOfBlog = blogEnd.map(singleBlog => singleBlog.id == updateBlog.id)
    expect(contentOfBlog.likes).toBe(updateBlog.likes)
  })
})

afterAll(() => {
  mongoose.connection.close()
})