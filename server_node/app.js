const express = require('express')
const app = express()
const port = 3000

app.get('/get_datas', 	require("./controllers/get_datas_api.js"))
app.get('/insert', 		require("./controllers/insert_datas.js"))
app.get('/transform', 	require("./controllers/transform_datas.js"))


app.get('/villes/details/:id', 				require("./controllers/ville/render.js"));
app.get('/villes/details/:id/ajax', 		require("./controllers/ville/ajax.js"));

app.get('/home', 		require("./controllers/home/render.js"));
app.post('/home/ajax', 	require("./controllers/home/ajax.js"));
app.get('/', 			require("./controllers/home/render.js"));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})