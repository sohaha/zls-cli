<template>
  <div>
    <router-link to="/">Home</router-link>
    <router-link to="/About">About</router-link>
    <router-link to="/Other">Other</router-link>
    <transition :name="transitionName" :mode="transitionMode">
      <router-view class="child-view"></router-view>
    </transition>
  </div>
</template>
<script>
export default {
  data() {
    return {
      pathList: [],
      transitionName: 'slide-left',
      transitionMode: ''
    }
  },
  watch: {
    '$route' (to, from) {
      if (this.pathList.includes(to.path)) {
        const index = (this.pathList.findIndex(() => {
          return from.path
        }))
        this.pathList.splice(index, 1)
        this.$router.isBack = true
      } else {
        this.pathList.push(to.path)
        this.$router.isBack = false
      }
      if (to.path === '/') {
        this.$router.isBack = true
        this.pathList = []
      }
      let isBack = this.$router.isBack
      if (isBack) {
        this.transitionName = 'slide-right'
        // this.transitionMode = ''
      } else {
        this.transitionName = 'slide-left'
        // this.transitionMode = 'in-out'
      }
      this.$router.isBack = false
    }
  },
  mounted() {},
  computed: {},
  methods: {},
  components: {}
}

</script>
<style>
html,
body {
  padding: 0;
  margin: 0;
  overflow-x: hidden;
}

.child-view {
  width: 100%;
  position: absolute;
}

.slide-left-enter-active {
  transition: all .3s ease;
}

.slide-left-leave-active {
  transition: all .8s ease;
}

.slide-left-enter {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-active {
  transition: all .3s ease;
}

.slide-right-leave-active {
  transition: all .8s ease;
}

.slide-right-enter {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

</style>
