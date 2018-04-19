const crypto = require('crypto');
const cipher = crypto.createCipheriv('aes-128-cbc', '1234567891234567', '0000000000000000');

let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
encrypted += cipher.final('hex')
console.log(encrypted)

const decipher = crypto.createDecipheriv('aes-128-cbc', '1234567891234567', '0000000000000000');
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8')
console.log(decrypted)