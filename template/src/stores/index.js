/**
 * Created by 影浅-Seekwe on 2017-02-27 00:52:20
 */
import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as getters from './getters';
import * as mutations from './mutations';
import modules from './modules';

Vue.use(Vuex);

export default new Vuex.Store({
  actions,
  getters,
  mutations,
  modules,
  strict: process.env.NODE_ENV !== 'production'//使用严格模式
});
