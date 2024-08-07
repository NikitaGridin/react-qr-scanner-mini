import { useEffect, useState } from 'react'
import { Scanner } from './components/scanner'

function App() {
	const [count, setCount] = useState(0)

	const handleScann = async ({ decodedText }: { decodedText: string }) => {
		console.log(decodedText)
		// Здесь вы можете добавить любую логику, которая может вызвать перерендеринг
		setCount((prevCount) => prevCount + 1)
	}

	// Для проверки, добавим перерендеринг каждые 5 секунд
	useEffect(() => {
		const interval = setInterval(() => {
			setCount((prevCount) => prevCount + 1)
		}, 5000)

		return () => clearInterval(interval)
	}, [])

	return (
		<div>
			<Scanner onScan={(decodedText) => handleScann({ decodedText })} />
			<div>Render count: {count}</div>
		</div>
	)
}

export default App
