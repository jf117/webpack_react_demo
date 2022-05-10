import App from './App'
import './style.css'
import './index.css'

if(module.hot){
  module.hot.accept(error=>{
    if(error){
      console.log('热替换出错了')
    }
  })
}