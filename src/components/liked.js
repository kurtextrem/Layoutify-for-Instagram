import { h, render, Component } from 'preact'
import { Router } from 'preact-router'
import Posts from './posts'

export default class Liked extends Posts {
	id = 'liked'
}
