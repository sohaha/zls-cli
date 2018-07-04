require('eventsource-polyfill')
const hotClient = require('webpack-hot-middleware/client?timeout=3000&reload=true&quiet=false')

//timeout=3000&overlay=true&
hotClient.subscribe(event => {
  if (event.action === 'reload') {
    window.location.reload()
  }
})

// console.log(hotClient)
// hotClient.useCustomOverlay(e=>{
//   // console.log(e)
// })

if (module.hot) {
  // module.hot.check(autoApply).then(outdatedModules => {
  //   console.log('超时的模块……')
  // }).catch(error => {
  //   // 捕获错误
  // });
  console.log('hothothothothothot')
}
