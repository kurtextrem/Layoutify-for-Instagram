import { createPortal } from 'preact/compat'

const NavPortal = props => document.getElementById('portal') && createPortal(props.children, document.getElementById('portal'))
export default NavPortal
