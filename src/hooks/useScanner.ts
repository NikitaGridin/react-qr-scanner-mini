import { type DetectedBarcode, BarcodeDetector } from 'barcode-detector'
import { RefObject, useCallback, useEffect, useRef } from 'react'
import { base64Beep } from '../base64Beep'
import { IUseScannerState } from '../types/types'

export function useScanner({
	videoElementRef,
	canvasElementRef,
	onScan,
	audio = true,
	allowMultiple = false,
}: {
	videoElementRef: RefObject<HTMLVideoElement>
	canvasElementRef: RefObject<HTMLCanvasElement>
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
				videoElementRef.current.readyState > 1 &&
				canvasElementRef.current !== null
			) {
				const { contentBefore } = state

				// Set up the canvas to match the video dimensions
				const canvas = canvasElementRef.current
				const ctx = canvas.getContext('2d')
				if (!ctx) return

				const video = videoElementRef.current
				const width = video.videoWidth
				const height = video.videoHeight

				// Define qrBox coordinates and size
				const qrBox = {
					x: 0.1 * width, // 10% from left
					y: 0.2 * height, // 20% from top
					width: 0.8 * width, // 80% width
					height: 0.6 * height, // 60% height
				}

				// Draw video frame onto canvas within qrBox
				canvas.width = qrBox.width
				canvas.height = qrBox.height
				ctx.drawImage(
					video,
					qrBox.x,
					qrBox.y,
					qrBox.width,
					qrBox.height,
					0,
					0,
					qrBox.width,
					qrBox.height
				)

				// Detect barcodes within the qrBox area
				const detectedCodes = await barcodeDetectorRef.current.detect(canvas)

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
		[videoElementRef, canvasElementRef, allowMultiple, audio, onScan]
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
