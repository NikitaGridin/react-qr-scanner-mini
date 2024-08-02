import { Scanner } from './components/scanner'

function App() {
	return (
		<div>
			<Scanner onScan={(decodedText) => alert(decodedText)} />
		</div>
	)
}

export default App
