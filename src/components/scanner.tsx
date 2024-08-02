import { useEffect, useMemo, useRef, useState } from 'react'
import useCamera from '../hooks/useCamera'
import useScanner from '../hooks/useScanner'
import { defaultConstraints } from '../misc/defaultConstraints'
import deepEqual from '../utilities/deepEqual'
import { Torch } from './torch'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Scanner({
	onScan,
	allowMultiple,
}: {
	onScan: (decodedText: string) => void
	allowMultiple?: boolean
}) {
	const videoRef = useRef<HTMLVideoElement>(null)

	const mergedConstraints = useMemo(
		() => ({
			...defaultConstraints,
		}),
		[]
	)

	const [isMounted, setIsMounted] = useState(false)
	const [isCameraActive, setIsCameraActive] = useState(true)
	const [constraintsCached, setConstraintsCached] = useState(mergedConstraints)
	const [torchSupported, setTorchSupported] = useState(false)

	const camera = useCamera()
	const { startScanning } = useScanner({
		videoElementRef: videoRef,
		onScan,
		audio: true,
		allowMultiple,
	})

	useEffect(() => {
		setIsMounted(true)
		return () => setIsMounted(false)
	}, [])

	useEffect(() => {
		if (!deepEqual(mergedConstraints, constraintsCached)) {
			const newConstraints = { ...mergedConstraints }
			setConstraintsCached(newConstraints)
		}
	}, [mergedConstraints, constraintsCached])

	const cameraSettings = useMemo(
		() => ({
			constraints: constraintsCached,
			shouldStream: isMounted,
		}),
		[constraintsCached, isMounted]
	)

	const onCameraChange = async () => {
		const videoEl = videoRef.current
		if (!videoEl) throw new Error('Video or Canvas element is missing.')

		if (cameraSettings.shouldStream) {
			await camera.stopCamera()
			setIsCameraActive(false)
			try {
				await camera.startCamera(videoEl, cameraSettings)
				setIsCameraActive(!!videoEl)

				// Check for torch support
				const stream = videoEl.srcObject
				if (stream instanceof MediaStream) {
					const track = stream.getVideoTracks()[0]
					const capabilities = track?.getCapabilities()
					setTorchSupported(capabilities && 'torch' in capabilities)
				} else {
					setTorchSupported(false)
				}
			} catch (error) {
				console.error('Camera error:', error)
			}
		} else {
			await camera.stopCamera()
			setIsCameraActive(false)
		}
	}

	useEffect(() => {
		// eslint-disable-next-line no-extra-semi
		;(async () => await onCameraChange())()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cameraSettings])

	const shouldScan = useMemo(
		() => cameraSettings.shouldStream && isCameraActive,
		[cameraSettings.shouldStream, isCameraActive]
	)

	useEffect(() => {
		if (shouldScan) {
			if (!videoRef.current) {
				throw new Error('Required elements are not defined.')
			}
			startScanning()
		}
	}, [shouldScan, startScanning])

	return (
		<div>
			<video
				ref={videoRef}
				autoPlay
				muted
				playsInline
				// style={{ width: '100%', height: '100%' }}
			/>
			{torchSupported && (
				<Torch
					scanning={isCameraActive}
					status={camera.settings.torch ?? false}
					torchToggle={async (value) => {
						const newConstraints = {
							...constraintsCached,
							advanced: [{ torch: value }],
						}
						await camera.updateConstraints(newConstraints)
					}}
				/>
			)}
		</div>
	)
}
