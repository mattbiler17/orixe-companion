import Providers from './app/providers'
import AppRouter from './app/router'
import './styles/globals.css'

export default function App(){
  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
