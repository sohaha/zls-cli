/**
 * Created by 影浅-Seekwe on 2017-02-27 00:52:22
 */
export default {
  namespaced: true,
  state: JSON.parse(sessionStorage.getItem('user')) || {
    'username': '影浅',
    'author': 'seekwe@gmail.com'
  }
};
