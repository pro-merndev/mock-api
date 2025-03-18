const jsonServer = require('json-server')
const server = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()
const https = require('https')
const fs = require('fs')
const path = require('path')

// SSL certificate options
const options = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
}

server.use(middlewares)
server.use(jsonServer.bodyParser)

// Custom POST route for SavedSearches
server.post('/SavedSearches', (req, res) => {
  const db = router.db
  const savedSearches = db.get('saved_searches')
  
  const newSearch = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  }

  // Check if name exists and isOverride is false
  const existingSearch = savedSearches
    .find({ userEmail: req.body.userEmail, name: req.body.name })
    .value()

  if (existingSearch && !req.body.isOverride) {
    return res.status(400).json({
      error: 'Search name already exists'
    })
  }

  // If isOverride true, remove existing search
  if (existingSearch && req.body.isOverride) {
    savedSearches
      .remove({ id: existingSearch.id })
      .write()
  }

  // Add new search
  savedSearches
    .push(newSearch)
    .write()

  res.status(201).json(newSearch)
})

// Add custom routes
const routes = JSON.parse(fs.readFileSync('routes.json'))
server.use(jsonServer.rewriter(routes))

server.use(router)

// Use HTTP instead of HTTPS
server.listen(3000, () => {
  console.log('JSON Server is running on http://localhost:3000')
}) 