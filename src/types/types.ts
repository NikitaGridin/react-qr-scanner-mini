export interface IBoundingBox {
	x: number
	y: number
	width: number
	height: number
}

import type { CSSProperties } from 'react'

export interface IDetectedBarcode {
	boundingBox: IBoundingBox
	cornerPoints: IPoint[]
	format: string
	rawValue: string
}

export type TrackFunction = (
	detectedCodes: IDetectedBarcode[],
	ctx: CanvasRenderingContext2D
) => void

export interface IUseScannerState {
	lastScan: number
	lastOnScan: number
	contentBefore: string[]
	lastScanHadContent: boolean
}
export interface IStopTaskResult {
	type: 'stop'
	data: {}
}
export interface IStartTaskResult {
	type: 'start'
	data: {
		videoEl: HTMLVideoElement
		stream: MediaStream
		constraints: MediaTrackConstraints
	}
}
export interface IStartCamera {
	constraints: MediaTrackConstraints
	restart?: boolean
}

export interface IScannerStyles {
	container?: CSSProperties
	video?: CSSProperties
}

export interface IScannerComponents {
	tracker?: TrackFunction
	audio?: boolean
	torch?: boolean
}

export interface IScannerComponents {
	tracker?: TrackFunction
	audio?: boolean
	onOff?: boolean
	finder?: boolean
	torch?: boolean
	zoom?: boolean
}
export interface IScannerClassNames {
	container?: string
	video?: string
}
export interface IPoint {
	x: number
	y: number
}

export interface IDetectedBarcode {
	boundingBox: IBoundingBox
	cornerPoints: IPoint[]
	format: string
	rawValue: string
}
