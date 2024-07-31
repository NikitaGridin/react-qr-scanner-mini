import { RefObject, useCallback, useEffect, useRef } from 'react'

import { type DetectedBarcode, BarcodeDetector } from 'barcode-detector'
import { base64Beep } from '../base64Beep'
import { IUseScannerState } from '../types/types'

export default function useScanner({
	videoElementRef,
	onScan,
	audio = true,
	allowMultiple = false,
}: {
	videoElementRef: RefObject<HTMLVideoElement>
	onScan: (result: string) => void
	audio?: boolean
	allowMultiple?: boolean
}) {
	const barcodeDetectorRef = useRef(new BarcodeDetector())
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const animationFrameIdRef = useRef<number | null>(null)

	useEffect(() => {
		barcodeDetectorRef.current = new BarcodeDetector()
	}, [])

	useEffect(() => {
		if (typeof window !== 'undefined' && audio) {
			audioRef.current = new Audio(base64Beep)
		}
	}, [audio])

	const processFrame = useCallback(
		(state: IUseScannerState) => async (timeNow: number) => {
			if (
				videoElementRef.current !== null &&
				videoElementRef.current.readyState > 1
			) {
				const { contentBefore } = state

				const detectedCodes = await barcodeDetectorRef.current.detect(
					videoElementRef.current
				)

				const anyNewCodesDetected = detectedCodes.some(
					(code: DetectedBarcode) => {
						return !contentBefore.includes(code.rawValue)
					}
				)

				const currentScanHasContent = detectedCodes.length > 0

				let lastOnScan = state.lastOnScan

				if (anyNewCodesDetected || (allowMultiple && currentScanHasContent)) {
					if (audio && audioRef.current && audioRef.current.paused) {
						audioRef.current
							.play()
							.catch((error) => console.error('Error playing the sound', error))
					}

					lastOnScan = timeNow

					onScan(detectedCodes[0].rawValue)
				}

				const newState = {
					lastScan: timeNow,
					lastOnScan: lastOnScan,
					lastScanHadContent: currentScanHasContent,
					contentBefore: anyNewCodesDetected
						? detectedCodes.map((code: DetectedBarcode) => code.rawValue)
						: contentBefore,
				}

				animationFrameIdRef.current = window.requestAnimationFrame(
					processFrame(newState)
				)
			}
		},
		[videoElementRef, allowMultiple, audio, onScan]
	)

	const startScanning = useCallback(() => {
		const current = performance.now()

		const initialState = {
			lastScan: current,
			lastOnScan: current,
			contentBefore: [],
			lastScanHadContent: false,
		}

		animationFrameIdRef.current = window.requestAnimationFrame(
			processFrame(initialState)
		)
	}, [processFrame])

	const stopScanning = useCallback(() => {
		if (animationFrameIdRef.current !== null) {
			window.cancelAnimationFrame(animationFrameIdRef.current)
			animationFrameIdRef.current = null
		}
	}, [])

	return {
		startScanning,
		stopScanning,
	}
}
