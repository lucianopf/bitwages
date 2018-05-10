const db = require('./db')

function cache ({fn, minutes=5, log=''}) {
  this.expires = new Date(new Date().getTime() + minutes *  60 * 1000)
  this.result = false
  this.resolve = () => {
    if (this.result && this.expires > new Date().getTime()) {
      return Promise.resolve(true)
        .then(() => this.result)
    } else {
      return Promise.resolve(true)
        .then(() => fn())
        .then(res => {
          this.result = res
        this.expires = new Date(new Date().getTime() + minutes * 60000)
          return res
        })
        .then(res => {
          if (log === 'Index') {
            try {
              db.saveApiResponse(res)
            } catch (e) {
              console.log('Error saving to history database')
            }
          }
          return res
        })
    }
  }
  return this
}

module.exports = (obj) => new cache(obj)