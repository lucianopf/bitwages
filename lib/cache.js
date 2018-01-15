const db = require('./db')

function cache ({fn, minutes=5, log=''}) {
  this.expires = new Date(new Date().getTime() + minutes *  60 * 1000)
  this.result = false
  this.resolve = () => {
    if (this.result && this.expires > new Date().getTime()) {
      console.log(`${log + ' - '}Cache hit - Expires at ${this.expires.toString()}`)
      return Promise.all([])
        .then(() => this.result)
    } else {
      console.log(`${log + ' - '}Cache miss - Expires at ${this.expires.toString()}`)
      return Promise.all([])
        .then(() => fn())
        .then(res => {
          console.log(`${log + ' - '}Response obtained at ${new Date().toString()}`)
          this.result = res
          this.expires = new Date(new Date().getTime() + minutes * 60000)
          return res
        })
        .then(res => {
          if (log === 'Index') {
            db.saveApiResponse(res)
          }
          return res
        })
    }
  }
  return this
}

module.exports = (obj) => new cache(obj)