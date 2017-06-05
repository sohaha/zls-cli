/**
 * Created by 影浅-Seekwe on 2017-02-27 00:20:20
 */
import Vue from 'vue'
<%_ if (vuex) { -%>
import store from "./stores"
<%_ } -%>
<%_ if (electron) { -%>
import Electron from 'vue-electron'
Vue.use(Electron)
<%_ } -%>
<%_ if (axios) { -%>
import axios from './utils/axios'
Vue.use (axios)
<%_ } -%>
<%_ if (router) { -%>
import App from './pages/App'
import router from './router'
<%_ } else { -%>
import App from './components/App'
<%_ } -%>
new Vue({
  el: '#app',
  render: h => h(App),
  <%_ if (vuex) { -%>
  store,
  <%_ } -%>
  <%_ if (router) { -%>
  router,
  <%_ } -%>
})
