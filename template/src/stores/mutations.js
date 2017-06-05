/**
 * Created by 影浅-Seekwe on 2017-02-27 00:52:20
 */
import Vue from 'vue'

export default {
  USER_SIGNIN: 'USER_SIGNIN',
  USER_SIGNOUT: 'USER_SIGNOUT',
}
export const USER_SIGNIN = (state, user) => {
  sessionStorage.setItem('user', JSON.stringify(user))
  Object.assign(state, user)
}
export const USER_SIGNOUT = (state) => {
  sessionStorage.removeItem('user')
  Object.keys(state)
    .forEach(k => Vue.delete(state, k))
}