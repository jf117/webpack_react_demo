import React from 'react'
import  ReactDOM  from 'react-dom'
import {isNull, isZero} from './utils'
import img1 from '@image/img1.png'
import img2 from '@image/img2.png'

isNull({})
// ES6
const App = () => {
  return (
    <div>
      <h1>React大家好123123</h1>
      <img src={img1} alt="" />
      <img src={img2} alt="" />
    </div>
  )
}

export default App
ReactDOM.render(<App />, document.getElementById('app'))