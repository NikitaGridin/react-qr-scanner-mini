import { Scanner } from './components/scanner'

function App() {
	return (
		<div>
			<Scanner onScan={(decodedText) => console.log(decodedText)} />
		</div>
	)
}

export default App
