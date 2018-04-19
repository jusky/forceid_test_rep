var request = require('request')

const url = 'http://52.80.167.165:8081/api-7RbozOwa/frame/auth/?tx=TX|aHp8NGJKQlQ3Q3ZzRVJnZVJaRnJzUUR8MTUxNjMzMDUyMw==|63ed81ab7c128d57590ac02f5c0f2db55720a8db&parent=http%3A%2F%2Ftest.aka.moe%3A8082%2Fdo_login%2F'
const urlLocal = 'http://172.31.29.22:8081/api-7RbozOwa/frame/auth/?tx=TX%7CaHp8NGJKQlQ3Q3ZzRVJnZVJaRnJzUUR8MTUxNjMzMDUyMw==%7C63ed81ab7c128d57590ac02f5c0f2db55720a8db&parent=http://test.aka.moe:8082/do_login/'
const urlNewUser = 'http://52.80.167.165:8081/api-7RbozOwa/frame/auth/?tx=TX|cHRlc3R8NGJKQlQ3Q3ZzRVJnZVJaRnJzUUR8MTUxNjM0ODk0OA==|41945157bbe5f377482530120a25d5647a466914&parent=http%3A%2F%2Ftest.aka.moe%3A8082%2Fdo_login%2F'

for (var i = 0; i < 5000; i++) {
    console.log('request No.', i, 'initiated')
    request.get(url, (error, response, body) => {
        console.log('ok')
    })
}