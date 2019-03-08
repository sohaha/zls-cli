/**
 * Created by 影浅-Seekwe on 2017-02-27 00:20:20
 */
import Vue from 'vue';
<%_ if (vuex) { -%>
import store from "./stores/index.js";
<%_ } -%>
<%_ if (electron) { -%>
import Electron from 'vue-electron';
Vue.use(Electron);
<%_ } -%>
<%_ if (axios) { -%>
import axios from './utils/axios.js';
Vue.use (axios);
<%_ } -%>
<%_ if (router) { -%>
import App from './app.vue';
import router from './router.js';
<%_ } else { -%>
import App from './components/app.vue';
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
});
