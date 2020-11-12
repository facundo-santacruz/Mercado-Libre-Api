var express = require('express')
var http = require('http')
var app = express()
const axios = require('axios')
var cors = require('cors')
const { response } = require('express')
const { addStorage } = require('./src/CacheStorage')
var list = []

const redis = require('redis');
// make a connection to the local instance of redis
const client = redis.createClient(6379);


client.on("error", (error) => {
  console.error(error);
 });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.send(users)
})

//------------------BUSCA UNA QUERY CON UN LIMITE DE 30 UNIDADES----------------------------


 
app.get('/recipe/:fooditem', (req, res) => {
  try {
    const foodItem = req.params.fooditem;
  
    // Check the redis store for the data first
    client.get(foodItem, async (err, recipe) => {
      if (recipe) {
        console.log("si existe en la cache");
        return res.status(200).send({
          error: false,
          message: `Recipe for ${foodItem} from the cache`,
          data: JSON.parse(recipe)
        })
      } else { // When the data is not found in the cache then we can make request to the server
  
          const recipe = await axios.get(`http://www.recipepuppy.com/api/?q=${foodItem}`);
          console.log("no existe en la cache");
          // save the record in the cache for subsequent request
          client.setex(foodItem, 1440, JSON.stringify(recipe.data.results));
  
          // return the result to the client
          return res.status(200).send({
            error: false,
            message: `Recipe for ${foodItem} from the server`,
            data: recipe.data.results
          });
      }
    }) 
  } catch (error) {
      console.log(error)
  }
 });
  







app.get('/api/search', function(req, res) {    
  console.log(req.query);
  try {
    const { search, number } = req.query;
    console.log(`${search}${number}`);
    // Check the redis store for the data first
    client.get(`${search}${number}`, async (err, recipe) => {
      if (recipe) {
        console.log("si existe en la cache");
        return res.status(200).send({
          error: false,
          message: `Recipe for query:${search} offset:${number} from the cache`,
          data: JSON.parse(recipe)
        })
      } else { // When the data is not found in the cache then we can make request to the server
        console.log("no existe en la cache");
        const recipe = await axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=${search}&offset=${number}&limit=${30}`);

        // save the record in the cache for subsequent request
        client.setex(`${search}${number}`, 1440, JSON.stringify(recipe.data));

        // return the result to the client
        return res.status(200).send({
          error: false,
          message: `Recipe for query:${search} offset:${number} from the server`,
          data: recipe.data
        });
    }
  }) 
} catch (error) {
    console.log(error)
}
});
  // var url = `https://api.mercadolibre.com/sites/MLA/search?q=${search}&offset=${number}&limit=${30}`
  // // caches.match({query: search, offset: number},).then (response => res.send(response)  )
  //   Axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=${search}&offset=${number}&limit=${30}`)
  //   // addStorage(url, rta.data)
  //   .then(rta => {
  //       if(!rta.data.results) {
  //           res.send('No se encontro lo que buscaba :(').status(404)
  //       }
  //       // const jsonResponse = new Response(JSON.stringify(response.data), {
  //       //   headers: {
  //       //       'content-type': 'application/json'
  //       //   }
  //       // });
  //       getCachedData()
  //       // console.log(Response)
  //       //  let  n= JSON.stringify(url)
  //       //  console.log(n)
  //       // caches.open(n).then(cache => cache.put(n, JSON.stringify(rta.data)))
       
  //       // .then(() =>      
  //       // addStorage(url, rta.data)
  //       res.json(rta.data)
  //   }).catch(err => {
  //       console.log('D: Error: ', err)
  //       res.send('No se encontro lo que buscaba  2:(').status(404)
  //   })
  // });

//----------BUSCA UNA QUERY CON UN LIMITE DE 30 UNIDADES Y UN ORDEN ASC/DESC ----------------------------

app.get('/api/sortprice', function(req, res) {    
console.log(req.query)
const { search, price, number } = req.query
    Axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=${search}&sort=${price}&offset=${number}&limit=${30}`)
    .then(rta => {
        if(!rta.data.results) {
            res.send('No hay resultados').status(404)
        }
          
        res.json(rta.data)
    }).catch(err => {
        console.log('D: Error: ', err)
        res.send('No se encontro lo que buscaba :(').status(404)
    })
});


//----------------------BUSCAR POR CONDICION (usado o no)------------------------------------------------------

app.get('/api/condition', function(req, res) {    
  console.log(req.query)
  const { search, number, condition } = req.query
      Axios.get(`https://api.mercadolibre.com/sites/MLA/search?q=${search}&offset=${number}&limit=${30}&condition=${condition}`)
      .then(rta => {
          if(!rta.data.results) {
              res.send('No hay resultados').status(404)
          }
            
          res.json(rta.data)
      }).catch(err => {
          console.log('D: Error: ', err)
          res.send('No se encontro lo que buscaba :(').status(404)
      })
  });
  

app.get('/', (req, res) => {
  res.status(200).send("Welcome to MERCADO LIBRE'S API REST")
})

http.createServer(app).listen(3001, () => {
  console.log('Server started at http://localhost:3001');
});