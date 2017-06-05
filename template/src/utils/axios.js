/**
 * Created by 影浅-seekwe@gmail.com on 2017-03-28
 */

import axios from 'axios'
import qs from 'qs'
const plugin = {}
const isJson = obj => {
  return (typeof obj === 'object') &&
    (Object.prototype.toString.call(obj)
      .toLowerCase() === '[object object]') &&
    !obj.length
}

plugin.install = function (Vue) {
  axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
  axios.defaults.headers['X-Requested-With'] = 'xmlhttprequest'
  // axios.defaults.baseURL = process.env.API
  axios.defaults.withCredentials = true
  // axios.defaults.transformRequest = [function (data) {
  //   return data
  // }]
  axios.defaults.validateStatus = function (code) {
    return true
  }
  axios.ZlsCustom = {}
  let before = null
  let after = null
  Object.defineProperties(Vue.prototype, {
    $axios: {
      get() {
        if (before === null) {
          before = axios.interceptors.request.use(config => {
            if (config.method === 'post') {
              config.data = qs.stringify(config.data)
            }
            return config
          }, error => {
            return Promise.reject(error)
          })
        }
        if (after === null) {
          after = axios.interceptors.response.use(response => {
            let data = response.data
            if (!isJson(data)) {
              console.log('Not JSON')
            }
            if (response.status === 200) {
              return response
            }
            return Promise.reject(response)
          }, error => {
            return Promise.reject(error)
          })
        }

        axios.ZlsCustom.unset = name => {
          switch (name) {
            case 'before':
              axios.interceptors.request.eject(before)
              before = null
              break
            case 'after':
              axios.interceptors.response.eject(after)
              after = null
              break
            default:
              break
          }
          return axios
        }
        return axios
      }
    }
  })
}
export default plugin