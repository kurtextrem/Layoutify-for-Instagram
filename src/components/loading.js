import { h, render, Component } from 'preact' // eslint-disable-line no-unused-vars

export default class Loading extends Component {
	constructor(props) {
		super(props)

		// could use props.width and props.height
	}

	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="128" height="128" fill="gray">
				<circle transform="translate(8 0)" cx="0" cy="16" r="0">
					<animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0"
						keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
				</circle>
				<circle transform="translate(16 0)" cx="0" cy="16" r="0">
					<animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.3"
						keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
				</circle>
				<circle transform="translate(24 0)" cx="0" cy="16" r="0">
					<animate attributeName="r" values="0; 4; 0; 0" dur="1.2s" repeatCount="indefinite" begin="0.6"
						keytimes="0;0.2;0.7;1" keySplines="0.2 0.2 0.4 0.8;0.2 0.6 0.4 0.8;0.2 0.6 0.4 0.8" calcMode="spline" />
				</circle>
			</svg>
		)
	}
}
