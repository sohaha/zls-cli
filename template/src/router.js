/**
 * Created by 影浅-Seekwe on 2017-02-27 00:22:17
 */
import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

// const router = new VueRouter({
//   routes: (r => {
//     let rule = []
//     r.keys()
//       .forEach(key => {
//         rule = rule.concat(r(key).default)
//       })
//     return rule
//   })(require.context('../', true, /^\.\/pages\/((?!\/)[\s\S])+\/route\.js$/)),
//   mode: 'hash'
// })

const router = new VueRouter({
  routes: [{
    path: '/about', meta: {
      title: 'About'
    }, component: r => require.ensure([], () => r(require(`@/pages/about.vue`)))
  }, {
    path: '/', meta: {
      title: 'Home'
    }, component: r => require.ensure([], () => r(require(`@/pages/home.vue`))), children: false
  }, {
    path: '*', meta: {
      title: 'Other'
    }, component: r => require.ensure([], () => r(require(`@/pages/home.vue`)))
  }], mode: 'hash'
  // base: __dirname
});

router.beforeEach(({ meta, path }, from, next) => {
  //return next('/Other')
  next();
});

export default router;
