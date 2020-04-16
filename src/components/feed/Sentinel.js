import { h } from 'preact'
import { memo } from 'preact/compat'

const Sentinel = props => <div class="sentinel-bottom" />

Sentinel.propTypes = {}

export default memo(Sentinel)
